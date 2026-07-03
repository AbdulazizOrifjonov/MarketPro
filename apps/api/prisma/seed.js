import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
}

const CATEGORY_TREE = [
  {
    nameUz: 'Elektronika', nameRu: 'Электроника', nameEn: 'Electronics',
    children: [
      { nameUz: 'Smartfonlar', nameRu: 'Смартфоны', nameEn: 'Smartphones' },
      { nameUz: 'Noutbuklar', nameRu: 'Ноутбуки', nameEn: 'Laptops' },
      { nameUz: 'Planshetlar', nameRu: 'Планшеты', nameEn: 'Tablets' },
      { nameUz: 'Aqlli soatlar', nameRu: 'Умные часы', nameEn: 'Smart Watches' },
      { nameUz: 'Televizorlar', nameRu: 'Телевизоры', nameEn: 'TVs' },
      { nameUz: 'Audio texnika', nameRu: 'Аудиотехника', nameEn: 'Audio' },
    ],
  },
  {
    nameUz: 'Maishiy texnika', nameRu: 'Бытовая техника', nameEn: 'Home Appliances',
    children: [
      { nameUz: 'Muzlatgichlar', nameRu: 'Холодильники', nameEn: 'Refrigerators' },
      { nameUz: 'Kir yuvish mashinalari', nameRu: 'Стиральные машины', nameEn: 'Washing Machines' },
      { nameUz: 'Idish yuvish mashinalari', nameRu: 'Посудомоечные машины', nameEn: 'Dishwashers' },
      { nameUz: 'Konditsionerlar', nameRu: 'Кондиционеры', nameEn: 'Air Conditioners' },
    ],
  },
  {
    nameUz: 'Asboblar', nameRu: 'Инструменты', nameEn: 'Tools',
    children: [
      { nameUz: 'Drel mashinalar', nameRu: 'Дрели', nameEn: 'Drill Machines' },
      { nameUz: 'Qurilish asbob-uskunalari', nameRu: 'Строительное оборудование', nameEn: 'Construction Equipment' },
    ],
  },
  {
    nameUz: 'Gaming', nameRu: 'Гейминг', nameEn: 'Gaming',
    children: [
      { nameUz: 'Konsollar', nameRu: 'Консоли', nameEn: 'Consoles' },
      { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', nameEn: 'Accessories' },
    ],
  },
  {
    nameUz: 'Moda', nameRu: 'Мода', nameEn: 'Fashion',
    children: [
      { nameUz: 'Erkaklar', nameRu: 'Мужчины', nameEn: 'Men' },
      { nameUz: 'Ayollar', nameRu: 'Женщины', nameEn: 'Women' },
    ],
  },
];

const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'LG', 'Artel', 'Sony', 'Asus', 'HP', 'Bosch', 'Nike'];

const PRODUCT_IMAGE_PLACEHOLDER = (seed) => [
  `https://picsum.photos/seed/${seed}-1/800/800`,
  `https://picsum.photos/seed/${seed}-2/800/800`,
  `https://picsum.photos/seed/${seed}-3/800/800`,
];

const PRODUCT_TEMPLATES = [
  { name: 'Galaxy S24 Ultra', cat: 'Smartphones', brand: 'Samsung', price: 14500000 },
  { name: 'iPhone 15 Pro', cat: 'Smartphones', brand: 'Apple', price: 16200000 },
  { name: 'Redmi Note 13 Pro', cat: 'Smartphones', brand: 'Xiaomi', price: 4200000 },
  { name: 'MacBook Air M3', cat: 'Laptops', brand: 'Apple', price: 18900000 },
  { name: 'ZenBook 14 OLED', cat: 'Laptops', brand: 'Asus', price: 11500000 },
  { name: 'Pavilion 15', cat: 'Laptops', brand: 'HP', price: 8700000 },
  { name: 'Galaxy Tab S9', cat: 'Tablets', brand: 'Samsung', price: 7800000 },
  { name: 'iPad 10th Gen', cat: 'Tablets', brand: 'Apple', price: 6200000 },
  { name: 'Watch GT 4', cat: 'Smart Watches', brand: 'Xiaomi', price: 1900000 },
  { name: 'Galaxy Watch 6', cat: 'Smart Watches', brand: 'Samsung', price: 3100000 },
  { name: 'No Frost RB37', cat: 'Refrigerators', brand: 'LG', price: 9800000 },
  { name: 'Side-by-Side Inverter', cat: 'Refrigerators', brand: 'Samsung', price: 16700000 },
  { name: 'WAJ28080BY 8kg', cat: 'Washing Machines', brand: 'Bosch', price: 5400000 },
  { name: 'AddWash 9kg', cat: 'Washing Machines', brand: 'Samsung', price: 6900000 },
  { name: 'SMS46GI01E', cat: 'Dishwashers', brand: 'Bosch', price: 7200000 },
  { name: 'Inverter Split AC 12000BTU', cat: 'Air Conditioners', brand: 'LG', price: 4300000 },
  { name: 'Artel Smart Inverter', cat: 'Air Conditioners', brand: 'Artel', price: 3600000 },
  { name: 'Impact Drill GSB 13RE', cat: 'Drill Machines', brand: 'Bosch', price: 980000 },
  { name: 'Cordless Drill 18V', cat: 'Drill Machines', brand: 'Bosch', price: 1450000 },
  { name: 'Concrete Mixer 130L', cat: 'Construction Equipment', brand: 'Bosch', price: 3200000 },
  { name: 'PlayStation 5', cat: 'Consoles', brand: 'Sony', price: 7900000 },
  { name: 'Xbox Series X', cat: 'Consoles', brand: 'Sony', price: 7400000 },
  { name: 'DualSense Wireless Controller', cat: 'Accessories', brand: 'Sony', price: 690000 },
  { name: 'Gaming Headset Pro', cat: 'Accessories', brand: 'Asus', price: 540000 },
  { name: 'Air Max Running Shoes', cat: 'Men', brand: 'Nike', price: 1250000 },
  { name: 'Classic Hoodie', cat: 'Men', brand: 'Nike', price: 480000 },
  { name: 'Running Leggings', cat: 'Women', brand: 'Nike', price: 390000 },
  { name: 'Sport Sneakers', cat: 'Women', brand: 'Nike', price: 1100000 },
  { name: 'OLED TV 55" C3', cat: 'Electronics', brand: 'LG', price: 12900000 },
  { name: 'Soundbar S800', cat: 'Electronics', brand: 'Sony', price: 3400000 },
];

async function main() {
  console.log('Seeding database...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.question.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.sliderBanner.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: process.env.ADMIN_SEED_EMAIL || 'admin@marketpro.uz',
      username: '1234',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      adminLevel: 'SUPER_ADMIN',
    },
  });
  await prisma.cart.create({ data: { userId: admin.id } });
  await prisma.wishlist.create({ data: { userId: admin.id } });

  const demoCustomerHash = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.create({
    data: {
      name: 'Aziz Karimov',
      email: 'customer@marketpro.uz',
      passwordHash: demoCustomerHash,
      phone: '+998901234567',
      role: 'CUSTOMER',
    },
  });
  await prisma.cart.create({ data: { userId: customer.id } });
  await prisma.wishlist.create({ data: { userId: customer.id } });

  const categoryBySlug = new Map();
  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.nameEn);
    const createdParent = await prisma.category.create({
      data: { nameUz: parent.nameUz, nameRu: parent.nameRu, nameEn: parent.nameEn, slug: parentSlug },
    });
    categoryBySlug.set(parent.nameEn, createdParent);

    for (const child of parent.children) {
      const childSlug = slugify(child.nameEn);
      const createdChild = await prisma.category.create({
        data: {
          nameUz: child.nameUz, nameRu: child.nameRu, nameEn: child.nameEn,
          slug: childSlug, parentId: createdParent.id,
        },
      });
      categoryBySlug.set(child.nameEn, createdChild);
    }
  }

  const brandByName = new Map();
  for (const name of BRANDS) {
    const brand = await prisma.brand.create({ data: { name } });
    brandByName.set(name, brand);
  }

  let sku = 1000;
  for (const tpl of PRODUCT_TEMPLATES) {
    const category = categoryBySlug.get(tpl.cat);
    const brand = brandByName.get(tpl.brand);
    if (!category) continue;

    const hasDiscount = Math.random() < 0.35;
    const seedSlug = `${slugify(tpl.brand)}-${slugify(tpl.name)}`;
    sku += 1;

    await prisma.product.create({
      data: {
        nameUz: `${tpl.brand} ${tpl.name}`,
        nameRu: `${tpl.brand} ${tpl.name}`,
        nameEn: `${tpl.brand} ${tpl.name}`,
        descriptionUz: `${tpl.brand} ${tpl.name} — yuqori sifatli mahsulot. Zamonaviy texnologiyalar va ishonchli ishlash muddati bilan.`,
        descriptionRu: `${tpl.brand} ${tpl.name} — высококачественный продукт с современными технологиями и надёжным сроком службы.`,
        descriptionEn: `${tpl.brand} ${tpl.name} — a high quality product with modern technology and reliable durability.`,
        slug: seedSlug,
        price: tpl.price,
        discountPrice: hasDiscount ? Math.round(tpl.price * 0.85) : null,
        stock: Math.floor(Math.random() * 80) + 5,
        sku: `MP-${sku}`,
        specs: JSON.stringify({ Brend: tpl.brand, Kafolat: '12 oy', 'Ishlab chiqarilgan davlat': 'Xitoy' }),
        brandId: brand?.id,
        categoryId: category.id,
        viewCount: Math.floor(Math.random() * 500),
        soldCount: Math.floor(Math.random() * 100),
        isFeatured: Math.random() < 0.25,
        images: { create: PRODUCT_IMAGE_PLACEHOLDER(seedSlug).map((url, i) => ({ url, order: i })) },
      },
    });
  }

  await prisma.sliderBanner.createMany({
    data: [
      { title: "Yozgi chegirmalar", subtitle: "70% gacha chegirma", imageUrl: 'https://picsum.photos/seed/slider1/1600/600', link: '/catalog?onSale=true', order: 0 },
      { title: 'Yangi smartfonlar', subtitle: "Eng so'nggi modellar", imageUrl: 'https://picsum.photos/seed/slider2/1600/600', link: '/catalog?category=smartphones', order: 1 },
      { title: 'Gaming dunyosi', subtitle: 'Konsol va aksessuarlar', imageUrl: 'https://picsum.photos/seed/slider3/1600/600', link: '/catalog?category=gaming', order: 2 },
    ],
  });

  await prisma.coupon.create({
    data: { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 100000, usageLimit: 1000 },
  });

  console.log('Seed complete.');
  console.log(`Admin login -> username: 1234, password: ${process.env.ADMIN_SEED_PASSWORD || 'admin123'}`);
  console.log('Customer login -> email: customer@marketpro.uz, password: customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
