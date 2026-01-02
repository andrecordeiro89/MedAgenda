Coloque aqui as imagens que devem ser empacotadas no build:

- imagem_de_login.(jpg|png|webp)
- imagem_de_login_2.(jpg|png|webp)

O código usa import.meta.glob para incluir qualquer uma das extensões existentes; se nenhuma estiver aqui, tenta a pasta public/images e, por fim, mostra um SVG de placeholder.
