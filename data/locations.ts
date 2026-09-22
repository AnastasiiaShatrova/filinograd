export type Location = {
  id: string;
  name: string;
  scene: string;
  image: string;
};

export const LOCATIONS: Location[] = [
  { id: "library", name: "Библиотека «Тихий омут»", scene: "полки до потолка, абажур, запах старых страниц, клетчатый плед у окна", image: "/locations/library.jpg" },
  { id: "pond", name: "Пруд у деревянного мостика", scene: "старая лодка, кувшинки, бочка с червями, вечерний свет", image: "/locations/pond.jpg" },
  { id: "canteen", name: "Столовая «Пух и Перья»", scene: "огромный самовар, корзины булочек, звякающие ложки", image: "/locations/canteen.jpg" },
  { id: "deans", name: "Деканат", scene: "дубовый стол, шкаф с грамотами, глобус, стопки бумаг, печать академии", image: "/locations/deans.jpg" },
  { id: "shop", name: "Лавка «Нить-и-Игла»", scene: "катушки до потолка, витрина с пяльцами, колокольчик над дверью", image: "/locations/shop.jpg" },
  { id: "greenhouse", name: "Моховая оранжерея", scene: "тёплые грядки, мох на камнях, погреб с ягодами, лейки", image: "/locations/greenhouse.jpg" },
  { id: "flight", name: "Аудитория ночных полётов", scene: "открытая форточка, карта звёздного неба, подушки на полу", image: "/locations/flight.jpg" },
  { id: "dorm", name: "Общежитие", scene: "лоскутные одеяла, вышивка в пяльцах на стене, тайник с сухариками", image: "/locations/dorm.jpg" },
  { id: "hall", name: "Вышивальный зал", scene: "три стенда факультетов, корзины с нитками, солнце из больших окон", image: "/locations/hall.jpg" },
  { id: "post", name: "Совиная почта", scene: "стеллаж с ячейками, сургучные печати, кожаные сумки", image: "/locations/post.jpg" },
  { id: "clock", name: "Часовая башня", scene: "медные шестерёнки, маятник, кукушка-совушка в окошке", image: "/locations/clock.jpg" },
  { id: "garden", name: "Ягодный палисад", scene: "грядка брусники, низкий заборчик, старая лейка, пугало-сова", image: "/locations/garden.jpg" },
  { id: "cafe", name: "Кафе «Сова на ветке»", scene: "маленькие столики, аромат кофе, пирожные на витрине, гирлянда из лампочек", image: "/locations/cafe.jpg" },
  { id: "workshop", name: "Ткацкая мастерская", scene: "ткацкий станок, мотки пряжи, манекен в накидке, ножницы", image: "/locations/workshop.jpg" },
  { id: "square", name: "Городская площадь", scene: "фонтан с совой, скамейки, фонари, брусчатка, клумбы", image: "/locations/square.jpg" },
];

export type Character = {
  id: string;
  name: string;
  desc: string;
  homeLocation: string;
  image: string;
};

export const CHARACTERS: Character[] = [
  { id: "splyushka", name: "госпожа Сплюшка", desc: "тихая хранительница библиотеки, дремлет на посту, знает все книги наизусть", homeLocation: "library", image: "/characters/splyushka.png" },
  { id: "peryshko", name: "студентка Пёрышко", desc: "прилежная ученица, вечно сидит в библиотеке над конспектами", homeLocation: "library", image: "/characters/peryshko.png" },
  { id: "kuzmich", name: "Кузьмич", desc: "рыбный филин, сторож пруда, знает все байки Филинграда", homeLocation: "pond", image: "/characters/kuzmich.png" },
  { id: "shchukar", name: "рыбак Щукарь", desc: "азартный рыбак, вечно хвастается размером пойманной рыбы", homeLocation: "pond", image: "/characters/shchukar.png" },
  { id: "neyasit", name: "тётя Неясыть", desc: "главная повариха, от неё всегда пахнет корицей и уютом", homeLocation: "canteen", image: "/characters/neyasit.png" },
  { id: "plyushka", name: "кондитер Плюшка", desc: "молодой кондитер, печёт пирожные в форме сов", homeLocation: "canteen", image: "/characters/plyushka.png" },
  { id: "filinych", name: "декан Филин Филиныч", desc: "рассеянный декан академии, очки вечно на лбу, но строгий по зачётам", homeLocation: "deans", image: "/characters/filinych.png" },
  { id: "gusena", name: "секретарь Гусёна", desc: "деловая гусыня, ведёт журнал успеваемости и расписание", homeLocation: "deans", image: "/characters/gusena.png" },
  { id: "igolka", name: "Иголка Совиньевна", desc: "заведующая лавкой ниток и канвы, ворчливая но добрая", homeLocation: "shop", image: "/characters/igolka.png" },
  { id: "nitochka", name: "ученица Ниточка", desc: "маленькая совушка, помогает в лавке и мечтает о своей вышивке", homeLocation: "shop", image: "/characters/nitochka.png" },
  { id: "mokhnonog", name: "дед Мохноног", desc: "старый садовник, растит мох и ягоды, разговаривает с растениями", homeLocation: "greenhouse", image: "/characters/mokhnonog.png" },
  { id: "lopatkin", name: "садовник Lopatkin", desc: "помощник деда, вечно в земле по уши, весёлый и шумный", homeLocation: "greenhouse", image: "/characters/lopatkin.png" },
  { id: "gerda", name: "Герда", desc: "полярная сова, староста, учит младших летать в темноте", homeLocation: "flight", image: "/characters/gerda.png" },
  { id: "veterok", name: "пилот Ветерок", desc: "быстрый стриж, инструктор по ночным полётам, обожает ветер", homeLocation: "flight", image: "/characters/veterok.png" },
  { id: "pukhlik", name: "Пухлик", desc: "крошка-сычик, первокурсник, вечно голодный и сонный", homeLocation: "dorm", image: "/characters/pukhlik.png" },
  { id: "topotun", name: "сосед Топотун", desc: "громкий филин, топает по ночам, но очень дружелюбный", homeLocation: "dorm", image: "/characters/topotun.png" },
  { id: "starosta", name: "староста Узорка", desc: "следит за стендами факультетов, строгая но справедливая", homeLocation: "hall", image: "/characters/starosta.png" },
  { id: "zolotinka", name: "мастерица Золотинка", desc: "вышивает золотыми нитками, её работы висят в ректорском кабинете", homeLocation: "hall", image: "/characters/zolotinka.png" },
  { id: "ushastik", name: "Ушастик", desc: "ушастый совёнок-почтальон, вечно всё теряет и путает адреса", homeLocation: "post", image: "/characters/ushastik.png" },
  { id: "konvertik", name: "почтальон Конвертик", desc: "аккуратная совушка, сортирует письма по цвету конвертов", homeLocation: "post", image: "/characters/konvertik.png" },
  { id: "sipukha", name: "Сипуха", desc: "часовщица, разговаривает с механизмами как с живыми", homeLocation: "clock", image: "/characters/sipukha.png" },
  { id: "tiktak", name: "ученик Тик-Так", desc: "молодой совёнок, учится чинить часы, вечно спешит", homeLocation: "clock", image: "/characters/tiktak.png" },
  { id: "klyukovka", name: "Клюковка", desc: "студентка, выращивает бруснику и охраняет пугало-сову", homeLocation: "garden", image: "/characters/klyukovka.png" },
  { id: "kogotok", name: "бариста Коготок", desc: "варит лучший кофе в Филинграде, знает все сплетни города", homeLocation: "cafe", image: "/characters/kogotok.png" },
  { id: "tkachikha", name: "мастерица Ткачиха", desc: "ткачиха, создаёт гобелены с видами Филинграда", homeLocation: "workshop", image: "/characters/tkachikha.png" },
];
