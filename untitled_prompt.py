from google import genai
from google.genai import types
import base64
import os

def generate():
  client = genai.Client(
      vertexai=True,
      api_key=os.environ.get("GOOGLE_CLOUD_API_KEY"),
  )

  si_text1 = """passawordd olan önceki oyunun reposuydu ama yeni repo olarak passaword reposunu oluşturdum. bu repoyu oluşturmamdaki amaç, hangi cihazdan oynanırsa oynansın(ios, android vs. gibi cihazlar ya da bilgisayar(web) gibi) siteye girildiği zaman site o anda hangi cihazdan oynanacağına göre siteyi o cihaza göre otamatik optimize etsin, daire büyüklüğü klavye açılırkenki dairenin görünümü vs. otamatik olarak yapılsın. bu yüzden passaword reposunda android, ios, web ve shared adında klasör oluşturup bu klasörlerin içine gerekli kodları yazdım. ama yaptığım bu yeni repodaki sitede oyun girdiğimde sitenin görünümü istediğim gibi olmamıştı, kalvye açıldığında dairenin görünümü değişmedi, balangıç sayfasında ayarlar, skor tablosu vs. gibi tuşlar aktif değildi. ayarlar kısmındaki seçenekler değişmişti ve eksikti, profil yükleme kısmında kendime özel olarak oluşturduğum /adminpanel ve /genelsifirla gibi özel paneli kullanamıyorum.(passawordd içinde bunlar var).sonuç kısmında tekrar oyna ve ana sayfa seçenekleri vardı şimdi tekrar oyna ve skor tablosu seçenekleri var, sonuç listesinde hata bildir seçeneği sadece yanlış cevaplanmış olanlarda var, normalde hepsinde olması gerekiyordu.web sürümü yani bilgisayarda oynarken enter ya da pas tuşuna basıp pas geçince tek tek geçirmiyor çift çift pas geçiyor, sadece tab tuşuna basınca tek tek pas geçiyor. birde puanlama sisteminde süre azalırken 10 saniye bir, 1 puan ekleniyor. benim istediğim bu değildi, oyun bittikten sonra kaç saniye kaldıysa ona göre her 10 saniyeye 1 puan eklenmesiydi. yani oyun bitince 40 saniye kaldıysa 4 puan eklenmeseydi, 57 saniye kalınca 5 puan eklenmesi vs. gibiydi.asıl amacım olan mobil cihazlarda oynanırken klavye açılmadan önce dairenin ekranın ortasında ekrana sığacak şekilde ekranın dolduracak, klavye açılınca klavyeden arta kalan ekranda daireler cihaza göre optimize olup ekrana sığacaktı. o da hatalı, klavye açılınca şimdi hiçbir değişiklik olmuyor.(buda passawordd reposunda mevcuttu ama cihazdan cihaza değişiklik göstermiyordu, android de çalışıyorsa iphonelarda garip davranıyordu ne androidde her cihazda ya da tarayıcıda aynı çalııyordu nede iphonelarda aynı şekil. yapmak istediklerim bunlar. daha detayı varda önce bu sorunları düzeltmem lazım
repolar; 
https://github.com/berat-arsln/PassaWordd
https://github.com/berat-arsln/PassaWord"""

  model = "gemini-3.1-pro-preview"
  contents = [
    types.Content(
      role="user",
      parts=[
      ]
    )
  ]
  tools = [
    types.Tool(google_search=types.GoogleSearch()),
  ]

  generate_content_config = types.GenerateContentConfig(
    temperature = 1,
    top_p = 0.95,
    max_output_tokens = 65535,
    safety_settings = [types.SafetySetting(
      category="HARM_CATEGORY_HATE_SPEECH",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_HARASSMENT",
      threshold="OFF"
    )],
    tools = tools,
    system_instruction=[types.Part.from_text(text=si_text1)],
    thinking_config=types.ThinkingConfig(
      thinking_level="HIGH",
    ),
  )

  for chunk in client.models.generate_content_stream(
    model = model,
    contents = contents,
    config = generate_content_config,
    ):
    if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
        continue
    print(chunk.text, end="")

generate()