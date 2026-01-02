Coloque aqui as imagens estáticas utilizadas pelo sistema para produção (build Vite).

Arquivos esperados:
- imagem_de_login.jpg (ou .png / .webp)
- imagem_de_login_2.jpg (ou .png / .webp)

Observações:
- O nome base deve ser exatamente "imagem_de_login" e "imagem_de_login_2".
- As extensões aceitas são .jpg, .png ou .webp.
- Durante o build, Vite servirá os arquivos em /images/..., portanto a URL final será:
  /images/imagem_de_login.jpg
  /images/imagem_de_login_2.jpg

Fallback:
- Se algum formato não estiver presente, o sistema tenta automaticamente outras extensões e também a versão relativa (images/...).
