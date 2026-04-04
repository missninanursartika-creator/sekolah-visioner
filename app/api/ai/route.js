import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FREE_AI_LIMIT = 3

const prompts = {
  diagnosis: ({ school, answers, score }) => `Kamu adalah konsultan pendidikan berpengalaman yang ahli dalam penyelarasan visi dan budaya sekolah.

Seorang kepala sekolah dari ${school} baru saja mengisi Lembar Diagnosis Visi:
${answers}

Skor: ${score} pertanyaan dijawab Ya.

Berikan analisis singkat (200-250 kata) dalam Bahasa Indonesia yang:
1. Interpretasikan kondisi visi sekolah ini secara jujur tapi membangun
2. Identifikasi 1-2 area kritis yang perlu perhatian segera
3. Berikan 2-3 langkah konkret yang bisa dimulai minggu ini
4. Akhiri dengan kalimat motivasi yang kuat

Gunakan gaya bahasa hangat, jujur, dan profesional.`,

  nilai: ({ school, values, defs }) => `Kamu adalah konsultan pendidikan yang ahli dalam character education dan school culture building.

Kepala sekolah ${school} memilih 3 nilai inti:
${values}

Definisi mereka:
${defs}

Berikan feedback konstruktif (200-250 kata) yang mencakup:
1. Penilaian kombinasi 3 nilai ini sebagai kompas keputusan
2. Sarankan definisi operasional yang lebih hidup jika masih abstrak
3. Berikan 1 contoh perilaku nyata di sekolah untuk setiap nilai
4. Saran 1 ritual mingguan untuk menghidupkan nilai ini`,

  intention: ({ school, statement, ppp }) => `Kamu adalah konsultan pendidikan yang berspesialisasi dalam merancang profil lulusan bermakna.

Kepala sekolah ${school} memiliki intention:
"${statement}"

Dimensi Profil Pelajar Pancasila dipilih: ${ppp}

Berikan analisis (200-250 kata) yang:
1. Evaluasi kekuatan intention ini
2. Sarankan penyempurnaan agar lebih hidup dan personal
3. Hubungkan dengan dimensi PPP yang dipilih
4. Berikan 2 contoh nyata siswa dengan intention ini di kelas`,

  komitmen: ({ school, k1, k2, k3 }) => `Kamu adalah executive coach yang mendampingi kepala sekolah.

Kepala sekolah ${school} menulis 3 komitmen:
1. ${k1}
2. ${k2}
3. ${k3}

Berikan coaching feedback (200-250 kata):
1. Evaluasi setiap komitmen — spesifik, terukur, realistis?
2. Sarankan versi lebih kuat untuk yang masih lemah
3. Identifikasi potensi hambatan terbesar
4. Bagaimana 3 komitmen ini saling memperkuat?`,

  visi: ({ school, values, intention, komitmen }) => `Kamu adalah ahli pendidikan dan penulis kreatif yang berspesialisasi dalam merancang visi sekolah.

Data sekolah ${school}:
- Nilai inti: ${values}
- Intention: ${intention}
- Komitmen: ${komitmen}

Buat SATU pernyataan visi (2-3 kalimat) menggunakan format:
"Kami adalah komunitas [NILAI], yang membentuk [INTENTION], melalui [COMMITMENT]."

Visi harus: puitis tapi konkret, inspiratif tapi terukur, membedakan dari sekolah lain.
Berikan hanya pernyataan visi tanpa intro atau penjelasan.`,

  healthcheck: ({ school, group, avgScore, answers }) => `Kamu adalah konsultan culture sekolah yang ahli menginterpretasi data Vision Health Check.

Sekolah: ${school}
Instrumen: ${group === 'guru' ? 'Guru' : group === 'sda' ? 'Siswa SD Kelas 1-3' : group === 'sdb' ? 'Siswa SD Kelas 4-6' : 'Siswa SMP/SMA'}
Rata-rata skor: ${avgScore}/5

Hasil per item:
${answers}

Berikan analisis (200-250 kata):
1. Seberapa hidup visi sekolah ini saat ini?
2. Area paling kuat — apa yang sudah bekerja dengan baik?
3. Area paling perlu perhatian — ini sinyal apa?
4. 3 rekomendasi aksi spesifik untuk bulan berikutnya
5. Satu kalimat penutup yang memotivasi

Gunakan data secara spesifik.`,
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cek plan & usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_usage_count, ai_usage_reset_at')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      // Reset usage jika sudah bulan baru
      const resetAt = new Date(profile?.ai_usage_reset_at)
      const now = new Date()
      const isNewMonth = now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()

      if (isNewMonth) {
        await supabase.from('profiles').update({
          ai_usage_count: 0,
          ai_usage_reset_at: now,
        }).eq('id', user.id)
        profile.ai_usage_count = 0
      }

      if (profile?.ai_usage_count >= FREE_AI_LIMIT) {
        return Response.json({
          error: 'limit_reached',
          message: `Paket gratis hanya ${FREE_AI_LIMIT} analisis AI per bulan. Upgrade ke Pro untuk analisis tidak terbatas.`,
        }, { status: 403 })
      }
    }

    const { type, data } = await request.json()

    const prompt = prompts[type]?.(data)
    if (!prompt) {
      return Response.json({ error: 'Invalid type' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    // Tambah usage count untuk user gratis
    if (profile?.plan !== 'pro') {
      await supabase.from('profiles').update({
        ai_usage_count: (profile?.ai_usage_count || 0) + 1,
      }).eq('id', user.id)
    }

    return Response.json({ result: message.content[0].text })
  } catch (error) {
    console.error('AI error:', error)
    return Response.json({ error: 'AI request failed' }, { status: 500 })
  }
}