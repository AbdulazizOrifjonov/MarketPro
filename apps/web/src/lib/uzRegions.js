export const UZ_REGIONS = [
  {
    name: "Toshkent shahri",
    districts: [
      "Bektemir", "Chilonzor", "Yashnobod", "Mirobod", "Mirzo Ulug'bek",
      "Sergeli", "Shayxontohur", "Olmazor", "Uchtepa", "Yakkasaroy", "Yunusobod", "Yangihayot",
    ],
  },
  {
    name: "Toshkent viloyati",
    districts: [
      "Bekobod tumani", "Bo'ka", "Bo'stonliq", "Chinoz", "Qibray", "Ohangaron",
      "Oqqo'rg'on", "Parkent", "Piskent", "Quyichirchiq", "Yuqorichirchiq",
      "O'rtachirchiq", "Zangiota", "Toshkent tumani", "Angren shahri",
      "Olmaliq shahri", "Bekobod shahri", "Chirchiq shahri", "Yangiyo'l shahri",
    ],
  },
  {
    name: "Andijon viloyati",
    districts: [
      "Andijon shahri", "Andijon tumani", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi",
      "Izboskan", "Jalaquduq", "Xo'jaobod", "Qo'rg'ontepa", "Marhamat", "Oltinko'l",
      "Paxtaobod", "Shahrixon", "Ulug'nor", "Xonobod shahri",
    ],
  },
  {
    name: "Farg'ona viloyati",
    districts: [
      "Farg'ona shahri", "Farg'ona tumani", "Beshariq", "Bog'dod", "Buvayda",
      "Dang'ara", "Furqat", "Qo'shtepa", "Quva", "Rishton", "So'x", "Toshloq",
      "O'zbekiston tumani", "Uchko'prik", "Yozyovon", "Marg'ilon shahri", "Qo'qon shahri",
    ],
  },
  {
    name: "Namangan viloyati",
    districts: [
      "Namangan shahri", "Namangan tumani", "Chortoq", "Chust", "Kosonsoy",
      "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uychi", "Uchqo'rg'on",
      "Yangiqo'rg'on", "Davlatobod",
    ],
  },
  {
    name: "Samarqand viloyati",
    districts: [
      "Samarqand shahri", "Samarqand tumani", "Bulung'ur", "Ishtixon", "Jomboy",
      "Kattaqo'rg'on tumani", "Qo'shrabot", "Narpay", "Nurobod", "Oqdaryo",
      "Pastdarg'om", "Paxtachi", "Payariq", "Toyloq", "Urgut", "Kattaqo'rg'on shahri",
    ],
  },
  {
    name: "Buxoro viloyati",
    districts: [
      "Buxoro shahri", "Buxoro tumani", "Olot", "G'ijduvon", "Jondor", "Kogon tumani",
      "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Shofirkon", "Vobkent", "Kogon shahri",
    ],
  },
  {
    name: "Qashqadaryo viloyati",
    districts: [
      "Qarshi shahri", "Qarshi tumani", "Chiroqchi", "Dehqonobod", "G'uzor",
      "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi",
      "Shahrisabz tumani", "Yakkabog'", "Shahrisabz shahri",
    ],
  },
  {
    name: "Surxondaryo viloyati",
    districts: [
      "Termiz shahri", "Termiz tumani", "Angor", "Bandixon", "Boysun", "Denov",
      "Jarqo'rg'on", "Qiziriq", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod",
      "Shorchi", "Uzun", "Denov shahri",
    ],
  },
  {
    name: "Jizzax viloyati",
    districts: [
      "Jizzax shahri", "Jizzax tumani", "Arnasoy", "Baxmal", "Do'stlik", "Forish",
      "G'allaorol", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin",
    ],
  },
  {
    name: "Sirdaryo viloyati",
    districts: [
      "Guliston shahri", "Guliston tumani", "Boyovut", "Mirzaobod", "Oqoltin",
      "Sardoba", "Sayxunobod", "Sirdaryo tumani", "Xovos", "Yangiyer shahri", "Shirin shahri",
    ],
  },
  {
    name: "Navoiy viloyati",
    districts: [
      "Navoiy shahri", "Konimex", "Karmana", "Navbahor", "Nurota", "Qiziltepa",
      "Tomdi", "Uchquduq", "Xatirchi", "Zarafshon shahri",
    ],
  },
  {
    name: "Xorazm viloyati",
    districts: [
      "Urganch shahri", "Urganch tumani", "Bog'ot", "Gurlan", "Hazorasp",
      "Qo'shko'pir", "Shovot", "Xonqa", "Xiva tumani", "Yangiariq", "Yangibozor", "Xiva shahri",
    ],
  },
  {
    name: "Qoraqalpog'iston Respublikasi",
    districts: [
      "Nukus shahri", "Nukus tumani", "Amudaryo", "Beruniy", "Chimboy",
      "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Qanliko'l", "Qorao'zak", "Qo'ng'irot",
      "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli",
    ],
  },
];

export function getDistricts(regionName) {
  return UZ_REGIONS.find((r) => r.name === regionName)?.districts || [];
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s*(viloyati|shahri|tumani|respublikasi|tuman)\s*$/g, '')
    .trim();
}

export function matchRegion(name) {
  const target = normalize(name);
  if (!target) return null;
  return (
    UZ_REGIONS.find((r) => normalize(r.name) === target) ||
    UZ_REGIONS.find((r) => normalize(r.name).includes(target) || target.includes(normalize(r.name))) ||
    null
  );
}

export function matchDistrict(regionName, districtName) {
  const districts = getDistricts(regionName);
  const target = normalize(districtName);
  if (!target) return null;
  return (
    districts.find((d) => normalize(d) === target) ||
    districts.find((d) => normalize(d).includes(target) || target.includes(normalize(d))) ||
    null
  );
}
