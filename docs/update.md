# Сайт Innocence translations

Каталог переводов: https://innocence-tls.github.io

## Добавить релиз

1. Создать папку `releases/<короткое-имя>/`, например `releases/sanoba-witch/`. Имя = адрес страницы
   (`/r/sanoba-witch/`): лучше общепринятое сокращение (manosaba, sakutoki), латиница, цифры, дефис.
2. Положить туда:
   - `poster.jpg`: постер (вертикальный, с русским логотипом). Он и на карточке, и на странице, и в превью ссылок, размытая копия идёт на фон;
   - `shots/` со скринами, если хочется (1.jpg, 2.jpg...), необязательно;
   - `release.yaml` по образцу ниже.
3. Отправить изменения (`git add . && git commit -m "Релиз X" && git push`).
   Через 1-2 минуты релиз на сайте.

Можно просто написать Claude: 'добавь на сайт релиз из поста t.me/innocence_translations/NNN'.

```yaml
title: Фуюкура, Куруру            # русское название
subtitle: Сплетая нити с зимы     # необязательно
original: Fuyukara, Kururu.       # оригинальное
vndb: v30012                      # разработчик, год, рейтинг подтянутся сами
status: released                  # released / wip (переводится) / planned (в планах)
progress: 60                      # только для wip, в процентах, необязательно
date: 2026-10-14                  # дата нашего релиза, по ней сортировка
length: 15-20 часов
platforms: [pc, android]
censorship: pixel                 # none / pixel / mosaic / nosex
favorite: true                    # звёздочка на карточке, необязательно
tags: [детектив, юри, драма]      # первые 6 видны на карточке
desc: >
  Описание в пару абзацев.
note: |
  Мелкая приписка: цикл, спецзаказ, совместимость. Ссылки кликабельны.
posts:                            # где лежит пост, иконки на карточке и на странице
  tg: https://t.me/innocence_translations/515
  vk: https://vk.com/wall-...
  boosty: https://boosty.to/innocence_translations/posts/...
accent: '#ff3366'                 # цвет акцента, обычно не нужен, берётся из постера
downloads:
  game:                           # Игра с русификатором
    - { host: gdrive, url: "https://drive.google.com/..." }
  android:                        # Android-версия
    - { host: tg, url: "https://t.me/innocence_files/71" }
  patch:                          # Русификатор
    - { host: gdrive, url: "https://drive.google.com/..." }
    - { host: tg, url: "https://t.me/innocence_files/72" }
```

Хосты: `gdrive`, `tg`, `yadisk`, `mega`, `boosty`, `mail`, `other`. У каждого своя иконка.
Свою подпись кнопки можно задать через `label: "Зеркало"`.

Для `wip`/`planned` хватает `title`, `original`, `vndb`, `status`: обложка скачается с VNDB сама
(если она без откровенного).

## Порты

Раздел 'Порты' (`/ports/`): `ports/<имя>/port.yaml`. Проще через админку (вкладка 'Порты', 'Новый порт' из ссылки на пост ТГ). Вручную:

```yaml
release: gerokasu        # необязательно: наш релиз, откуда возьмутся название, оригинал, vndb, постер
title: Эйфория           # без release: свои название / original / vndb
original: Euphoria
date: 2026-10-16
to: [android]            # на что порт: pc, android, switch, ps3, ps4, ps5, psp, vita, ios
from: pc                 # с чего
engine: YU-RIS
translation: { by: WyccStreams, url: "https://boosty.to/wyccstreams" }   # пусто = наш перевод
features: [Правки текста, Доперевод около 300 строк]
note: Спецзаказ. Ссылки в тексте станут кликабельными.
posts: { tg: "https://t.me/innocence_translations/527" }
downloads:
  android:
    - { host: tg, url: "https://t.me/innocence_files/76" }
  game:                  # версия для ПК, если есть
    - { host: gdrive, url: "https://drive.google.com/…" }
```

Постер: `poster.jpg` в папке порта; нет его, берётся постер релиза или обложка VNDB.

## Превью ссылок

Для каждого релиза при сборке рисуется картинка 1200x630 (`/og/<имя>.jpg`): постер, название,
год, разработчик, длительность, рейтинг VNDB, теги. Её показывают Telegram, VK, Discord,
когда кидаешь ссылку на релиз. Постер берётся из `poster.jpg`; если его нет, то обложка с VNDB
(только без откровенного), а если и её нет, превью будет без постера, на фоне баннера.
У главной своё превью (`/og/home.jpg`): аватар, название и веер из постеров последних релизов.
Telegram кеширует превью: если ссылку уже кидали до правки,
обновить можно через бота @WebpageBot.

## Соцсети и описание группы

`site.yaml`: ссылки на Telegram, чат, VK, Boosty, донат. Убрал строку, кнопка пропала.
Там же `requests`: ссылки на стол заказов в каждой соцсети (страница 'Стол заказов').

## Локально

```
npm install
npm run dev      # http://localhost:4321
npm run build    # то же, что делает GitHub
```

Если в `release.yaml` ошибка, сборка напишет файл и поле. Сайт при этом не ломается:
GitHub выкладывает только успешные сборки.
