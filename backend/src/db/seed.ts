import { db } from './initDb';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  // Wait for database to be ready
  await db.ready();
  // Seed Roles
  const roles = [
    { role_id: 4, name: 'administrator', description: 'Full system access' },
    { role_id: 3, name: 'management', description: 'Store management access' },
    { role_id: 1, name: 'control', description: 'Limited access (unused)' },
    { role_id: 2, name: 'regular', description: 'Regular user access' },
  ];

  for (const role of roles) {
    const exists = await db.get('SELECT role_id FROM Role WHERE role_id = ?', [role.role_id]);
    if (!exists) {
      await db.run(
        'INSERT INTO Role (role_id, name, description) VALUES (?, ?, ?)',
        [role.role_id, role.name, role.description]
      );
      console.log(`Inserted role: ${role.name}`);
    }
  }

  // Seed RegularUserTypes
  const userTypes = [
    { user_type_id: 1, name: 'customer' },
    { user_type_id: 2, name: 'designer' },
  ];

  for (const type of userTypes) {
    const exists = await db.get('SELECT user_type_id FROM RegularUserType WHERE user_type_id = ?', [type.user_type_id]);
    if (!exists) {
      await db.run(
        'INSERT INTO RegularUserType (user_type_id, name) VALUES (?, ?)',
        [type.user_type_id, type.name]
      );
      console.log(`Inserted user type: ${type.name}`);
    }
  }

  // Seed a system manager user for categories (if not exists)
  const systemManager = await db.get('SELECT user_id FROM User WHERE username = ?', ['system_manager']);
  let managerId: number;
  if (!systemManager) {
    const hashedPassword = await bcrypt.hash('system123', 10);
    await db.run(
      'INSERT INTO User (email, username, password_hash, role_id) VALUES (?, ?, ?, ?)',
      ['system@store.com', 'system_manager', hashedPassword, 3]
    );
    const newManager = await db.get('SELECT user_id FROM User WHERE username = ?', ['system_manager']);
    managerId = newManager.user_id;
    console.log('Inserted system manager user');
  } else {
    managerId = systemManager.user_id;
  }

  // Seed Categories
  const categories = [
    { name: 'Clothing', description: 'T-shirts, hoodies, and other apparel' },
    { name: 'Accessories', description: 'Caps, bags, and wearable accessories' },
    { name: 'Drinkware', description: 'Mugs, bottles, and cups' },
    { name: 'Stationery', description: 'Stickers, notebooks, and office items' },
    { name: 'Home & Decor', description: 'Pillows, blankets, and home accessories' },
    { name: 'Tech', description: 'Tech accessories and gadgets' },
  ];

  for (const category of categories) {
    const exists = await db.get('SELECT category_id FROM Category WHERE name = ?', [category.name]);
    if (!exists) {
      await db.run(
        'INSERT INTO Category (name, description, manager_id) VALUES (?, ?, ?)',
        [category.name, category.description, managerId]
      );
      console.log(`Inserted category: ${category.name}`);
    }
  }

  // Get category IDs
  const clothingCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Clothing']);
  const accessoriesCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Accessories']);
  const drinkwareCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Drinkware']);
  const stationeryCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Stationery']);
  const homeCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Home & Decor']);
  const techCat = await db.get('SELECT category_id FROM Category WHERE name = ?', ['Tech']);

  // Seed Products
  const products = [
    // Clothing - T-Shirts
    { name: 'Classic T-Shirt', description: 'Comfortable cotton t-shirt perfect for custom prints', base_price: 9.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt.png' },
    { name: 'Premium T-Shirt', description: 'High-quality organic cotton t-shirt', base_price: 14.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt-premium.png' },
    { name: 'V-Neck T-Shirt', description: 'Stylish v-neck cotton t-shirt', base_price: 11.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt-vneck.png' },
    { name: 'Long Sleeve T-Shirt', description: 'Comfortable long sleeve cotton shirt', base_price: 14.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt-longsleeve.png' },
    { name: 'Fitted T-Shirt', description: 'Slim fit t-shirt for a modern look', base_price: 12.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt-fitted.png' },
    { name: 'Oversized T-Shirt', description: 'Relaxed oversized fit for casual comfort', base_price: 13.90, product_type: 'T-Shirt', category_id: clothingCat.category_id, picture_url: '/images/tshirt-oversized.png' },

    // Clothing - Hoodies & Sweatshirts
    { name: 'Hoodie', description: 'Warm and cozy hoodie with front pocket', base_price: 29.90, product_type: 'Hoodie', category_id: clothingCat.category_id, picture_url: '/images/hoodie.png' },
    { name: 'Zip-Up Hoodie', description: 'Full-zip hoodie for easy layering', base_price: 34.90, product_type: 'Hoodie', category_id: clothingCat.category_id, picture_url: '/images/hoodie-zip.png' },
    { name: 'Lightweight Hoodie', description: 'Perfect for mild weather', base_price: 24.90, product_type: 'Hoodie', category_id: clothingCat.category_id, picture_url: '/images/hoodie-light.png' },
    { name: 'Premium Hoodie', description: 'Heavy-weight premium cotton hoodie', base_price: 39.90, product_type: 'Hoodie', category_id: clothingCat.category_id, picture_url: '/images/hoodie-premium.png' },
    { name: 'Sweatshirt', description: 'Classic crewneck sweatshirt', base_price: 24.90, product_type: 'Sweatshirt', category_id: clothingCat.category_id, picture_url: '/images/sweatshirt.png' },
    { name: 'Quarter-Zip Sweatshirt', description: 'Athletic quarter-zip pullover', base_price: 29.90, product_type: 'Sweatshirt', category_id: clothingCat.category_id, picture_url: '/images/sweatshirt-quarterzip.png' },

    // Clothing - Other
    { name: 'Tank Top', description: 'Lightweight tank top for summer', base_price: 12.90, product_type: 'Tank Top', category_id: clothingCat.category_id, picture_url: '/images/tanktop.png' },
    { name: 'Crop Top', description: 'Trendy crop top for casual wear', base_price: 11.90, product_type: 'Crop Top', category_id: clothingCat.category_id, picture_url: '/images/croptop.png' },
    { name: 'Polo Shirt', description: 'Classic polo shirt with collar', base_price: 19.90, product_type: 'Polo', category_id: clothingCat.category_id, picture_url: '/images/polo.png' },
    { name: 'Jersey', description: 'Sports jersey with custom number', base_price: 29.90, product_type: 'Jersey', category_id: clothingCat.category_id, picture_url: '/images/jersey.png' },
    { name: 'Jacket', description: 'Lightweight windbreaker jacket', base_price: 44.90, product_type: 'Jacket', category_id: clothingCat.category_id, picture_url: '/images/jacket.png' },
    { name: 'Joggers', description: 'Comfortable cotton jogger pants', base_price: 29.90, product_type: 'Pants', category_id: clothingCat.category_id, picture_url: '/images/joggers.png' },
    { name: 'Shorts', description: 'Athletic shorts with pockets', base_price: 19.90, product_type: 'Shorts', category_id: clothingCat.category_id, picture_url: '/images/shorts.png' },
    { name: 'Dress', description: 'Casual t-shirt dress', base_price: 24.90, product_type: 'Dress', category_id: clothingCat.category_id, picture_url: '/images/dress.png' },
    { name: 'Apron', description: 'Kitchen apron with front pocket', base_price: 16.90, product_type: 'Apron', category_id: clothingCat.category_id, picture_url: '/images/apron.png' },

    // Accessories - Headwear
    { name: 'Baseball Cap', description: 'Adjustable baseball cap with curved brim', base_price: 14.90, product_type: 'Cap', category_id: accessoriesCat.category_id, picture_url: '/images/cap.png' },
    { name: 'Snapback Cap', description: 'Flat brim snapback with adjustable strap', base_price: 16.90, product_type: 'Cap', category_id: accessoriesCat.category_id, picture_url: '/images/snapback.png' },
    { name: 'Trucker Hat', description: 'Mesh back trucker cap', base_price: 14.90, product_type: 'Cap', category_id: accessoriesCat.category_id, picture_url: '/images/trucker.png' },
    { name: 'Dad Hat', description: 'Relaxed fit dad hat', base_price: 12.90, product_type: 'Cap', category_id: accessoriesCat.category_id, picture_url: '/images/dadhat.png' },
    { name: 'Beanie', description: 'Warm knit beanie for cold days', base_price: 12.90, product_type: 'Beanie', category_id: accessoriesCat.category_id, picture_url: '/images/beanie.png' },
    { name: 'Cuffed Beanie', description: 'Classic cuffed knit beanie', base_price: 11.90, product_type: 'Beanie', category_id: accessoriesCat.category_id, picture_url: '/images/beanie-cuffed.png' },
    { name: 'Bucket Hat', description: 'Trendy bucket hat for sun protection', base_price: 14.90, product_type: 'Hat', category_id: accessoriesCat.category_id, picture_url: '/images/buckethat.png' },
    { name: 'Visor', description: 'Sports visor for active wear', base_price: 9.90, product_type: 'Visor', category_id: accessoriesCat.category_id, picture_url: '/images/visor.png' },
    { name: 'Headband', description: 'Athletic headband with custom print', base_price: 7.90, product_type: 'Headband', category_id: accessoriesCat.category_id, picture_url: '/images/headband.png' },

    // Accessories - Bags
    { name: 'Tote Bag', description: 'Eco-friendly canvas tote bag', base_price: 19.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/tote.png' },
    { name: 'Backpack', description: 'Durable backpack with laptop compartment', base_price: 39.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/backpack.png' },
    { name: 'Drawstring Bag', description: 'Lightweight drawstring backpack', base_price: 9.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/drawstring.png' },
    { name: 'Messenger Bag', description: 'Classic messenger bag with strap', base_price: 34.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/messenger.png' },
    { name: 'Duffel Bag', description: 'Spacious duffel bag for travel', base_price: 44.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/duffel.png' },
    { name: 'Fanny Pack', description: 'Retro fanny pack / belt bag', base_price: 16.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/fannypack.png' },
    { name: 'Laptop Sleeve', description: 'Padded laptop sleeve', base_price: 19.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/laptopsleeve.png' },
    { name: 'Cosmetic Bag', description: 'Small zippered cosmetic pouch', base_price: 11.90, product_type: 'Bag', category_id: accessoriesCat.category_id, picture_url: '/images/cosmeticbag.png' },

    // Accessories - Other
    { name: 'Phone Case', description: 'Protective phone case with custom print', base_price: 14.90, product_type: 'Phone Case', category_id: accessoriesCat.category_id, picture_url: '/images/phonecase.png' },
    { name: 'Wallet', description: 'Compact bifold wallet', base_price: 19.90, product_type: 'Wallet', category_id: accessoriesCat.category_id, picture_url: '/images/wallet.png' },
    { name: 'Keychain', description: 'Custom acrylic keychain', base_price: 4.90, product_type: 'Keychain', category_id: accessoriesCat.category_id, picture_url: '/images/keychain.png' },
    { name: 'Lanyard', description: 'Printed lanyard with clip', base_price: 5.90, product_type: 'Lanyard', category_id: accessoriesCat.category_id, picture_url: '/images/lanyard.png' },
    { name: 'Sunglasses', description: 'Classic sunglasses with custom arms', base_price: 9.90, product_type: 'Sunglasses', category_id: accessoriesCat.category_id, picture_url: '/images/sunglasses.png' },
    { name: 'Wristband', description: 'Silicone wristband with custom text', base_price: 2.90, product_type: 'Wristband', category_id: accessoriesCat.category_id, picture_url: '/images/wristband.png' },
    { name: 'Pin Badge', description: 'Custom enamel pin badge', base_price: 3.90, product_type: 'Pin', category_id: accessoriesCat.category_id, picture_url: '/images/pin.png' },
    { name: 'Scarf', description: 'Soft printed scarf', base_price: 19.90, product_type: 'Scarf', category_id: accessoriesCat.category_id, picture_url: '/images/scarf.png' },
    { name: 'Socks', description: 'Comfortable crew socks with custom design', base_price: 8.90, product_type: 'Socks', category_id: accessoriesCat.category_id, picture_url: '/images/socks.png' },
    { name: 'Face Mask', description: 'Reusable fabric face mask', base_price: 6.90, product_type: 'Mask', category_id: accessoriesCat.category_id, picture_url: '/images/facemask.png' },

    // Drinkware
    { name: 'Classic Mug', description: 'Ceramic mug perfect for your morning coffee', base_price: 7.90, product_type: 'Mug', category_id: drinkwareCat.category_id, picture_url: '/images/mug.png' },
    { name: 'Large Mug', description: 'Extra large 15oz ceramic mug', base_price: 9.90, product_type: 'Mug', category_id: drinkwareCat.category_id, picture_url: '/images/mug-large.png' },
    { name: 'Magic Mug', description: 'Heat-revealing color changing mug', base_price: 12.90, product_type: 'Mug', category_id: drinkwareCat.category_id, picture_url: '/images/mug-magic.png' },
    { name: 'Enamel Mug', description: 'Durable enamel camping mug', base_price: 11.90, product_type: 'Mug', category_id: drinkwareCat.category_id, picture_url: '/images/mug-enamel.png' },
    { name: 'Travel Mug', description: 'Insulated travel mug keeps drinks hot or cold', base_price: 16.90, product_type: 'Mug', category_id: drinkwareCat.category_id, picture_url: '/images/travelmug.png' },
    { name: 'Espresso Cup', description: 'Small espresso cup with saucer', base_price: 8.90, product_type: 'Cup', category_id: drinkwareCat.category_id, picture_url: '/images/espresso.png' },
    { name: 'Water Bottle', description: 'Stainless steel water bottle', base_price: 19.90, product_type: 'Bottle', category_id: drinkwareCat.category_id, picture_url: '/images/bottle.png' },
    { name: 'Sports Bottle', description: 'Squeezable sports water bottle', base_price: 12.90, product_type: 'Bottle', category_id: drinkwareCat.category_id, picture_url: '/images/bottle-sports.png' },
    { name: 'Glass Bottle', description: 'Glass water bottle with silicone sleeve', base_price: 14.90, product_type: 'Bottle', category_id: drinkwareCat.category_id, picture_url: '/images/bottle-glass.png' },
    { name: 'Tumbler', description: 'Double-wall insulated tumbler with straw', base_price: 14.90, product_type: 'Tumbler', category_id: drinkwareCat.category_id, picture_url: '/images/tumbler.png' },
    { name: 'Wine Tumbler', description: 'Insulated wine tumbler with lid', base_price: 16.90, product_type: 'Tumbler', category_id: drinkwareCat.category_id, picture_url: '/images/tumbler-wine.png' },
    { name: 'Beer Stein', description: 'Classic beer stein with handle', base_price: 14.90, product_type: 'Glass', category_id: drinkwareCat.category_id, picture_url: '/images/beerstein.png' },
    { name: 'Pint Glass', description: 'Standard 16oz pint glass', base_price: 8.90, product_type: 'Glass', category_id: drinkwareCat.category_id, picture_url: '/images/pintglass.png' },
    { name: 'Wine Glass', description: 'Stemless wine glass', base_price: 9.90, product_type: 'Glass', category_id: drinkwareCat.category_id, picture_url: '/images/wineglass.png' },
    { name: 'Shot Glass', description: 'Custom printed shot glass', base_price: 4.90, product_type: 'Glass', category_id: drinkwareCat.category_id, picture_url: '/images/shotglass.png' },
    { name: 'Coaster Set', description: 'Set of 4 custom coasters', base_price: 12.90, product_type: 'Coaster', category_id: drinkwareCat.category_id, picture_url: '/images/coasters.png' },
    { name: 'Can Cooler', description: 'Neoprene can cooler / koozie', base_price: 5.90, product_type: 'Cooler', category_id: drinkwareCat.category_id, picture_url: '/images/cancooler.png' },

    // Stationery
    { name: 'Sticker Pack', description: 'Set of 10 custom vinyl stickers', base_price: 2.90, product_type: 'Sticker', category_id: stationeryCat.category_id, picture_url: '/images/stickers.png' },
    { name: 'Large Sticker', description: 'Single large vinyl sticker', base_price: 1.90, product_type: 'Sticker', category_id: stationeryCat.category_id, picture_url: '/images/sticker-large.png' },
    { name: 'Bumper Sticker', description: 'Weather-resistant bumper sticker', base_price: 3.90, product_type: 'Sticker', category_id: stationeryCat.category_id, picture_url: '/images/bumpersticker.png' },
    { name: 'Notebook', description: 'Hardcover notebook with custom cover', base_price: 9.90, product_type: 'Notebook', category_id: stationeryCat.category_id, picture_url: '/images/notebook.png' },
    { name: 'Spiral Notebook', description: 'Spiral-bound notebook', base_price: 7.90, product_type: 'Notebook', category_id: stationeryCat.category_id, picture_url: '/images/notebook-spiral.png' },
    { name: 'Sketchbook', description: 'Blank sketchbook for artists', base_price: 11.90, product_type: 'Notebook', category_id: stationeryCat.category_id, picture_url: '/images/sketchbook.png' },
    { name: 'Journal', description: 'Leather-bound journal', base_price: 14.90, product_type: 'Notebook', category_id: stationeryCat.category_id, picture_url: '/images/journal.png' },
    { name: 'Planner', description: 'Weekly planner with custom cover', base_price: 16.90, product_type: 'Planner', category_id: stationeryCat.category_id, picture_url: '/images/planner.png' },
    { name: 'Mousepad', description: 'Large mousepad with custom design', base_price: 11.90, product_type: 'Mousepad', category_id: stationeryCat.category_id, picture_url: '/images/mousepad.png' },
    { name: 'Desk Mat', description: 'Extra large desk mat', base_price: 24.90, product_type: 'Mousepad', category_id: stationeryCat.category_id, picture_url: '/images/deskmat.png' },
    { name: 'Poster', description: 'High-quality poster print', base_price: 8.90, product_type: 'Poster', category_id: stationeryCat.category_id, picture_url: '/images/poster.png' },
    { name: 'Large Poster', description: 'Large format poster print', base_price: 14.90, product_type: 'Poster', category_id: stationeryCat.category_id, picture_url: '/images/poster-large.png' },
    { name: 'Greeting Card', description: 'Custom greeting card with envelope', base_price: 2.90, product_type: 'Card', category_id: stationeryCat.category_id, picture_url: '/images/greetingcard.png' },
    { name: 'Postcard', description: 'Custom printed postcard', base_price: 1.90, product_type: 'Card', category_id: stationeryCat.category_id, picture_url: '/images/postcard.png' },
    { name: 'Business Cards', description: 'Pack of 100 custom business cards', base_price: 19.90, product_type: 'Card', category_id: stationeryCat.category_id, picture_url: '/images/businesscards.png' },
    { name: 'Bookmark', description: 'Custom printed bookmark', base_price: 2.90, product_type: 'Bookmark', category_id: stationeryCat.category_id, picture_url: '/images/bookmark.png' },
    { name: 'Pen', description: 'Custom printed ballpoint pen', base_price: 3.90, product_type: 'Pen', category_id: stationeryCat.category_id, picture_url: '/images/pen.png' },
    { name: 'Pencil Case', description: 'Zippered pencil case', base_price: 8.90, product_type: 'Case', category_id: stationeryCat.category_id, picture_url: '/images/pencilcase.png' },
    { name: 'Clipboard', description: 'Custom printed clipboard', base_price: 9.90, product_type: 'Clipboard', category_id: stationeryCat.category_id, picture_url: '/images/clipboard.png' },
    { name: 'Calendar', description: 'Wall calendar with custom photos', base_price: 19.90, product_type: 'Calendar', category_id: stationeryCat.category_id, picture_url: '/images/calendar.png' },
    { name: 'Desk Calendar', description: 'Standing desk calendar', base_price: 12.90, product_type: 'Calendar', category_id: stationeryCat.category_id, picture_url: '/images/calendar-desk.png' },

    // Home & Decor
    { name: 'Throw Pillow', description: 'Soft throw pillow with custom print', base_price: 19.90, product_type: 'Pillow', category_id: homeCat.category_id, picture_url: '/images/pillow.png' },
    { name: 'Floor Pillow', description: 'Large floor cushion', base_price: 29.90, product_type: 'Pillow', category_id: homeCat.category_id, picture_url: '/images/pillow-floor.png' },
    { name: 'Blanket', description: 'Soft fleece blanket with custom design', base_price: 39.90, product_type: 'Blanket', category_id: homeCat.category_id, picture_url: '/images/blanket.png' },
    { name: 'Sherpa Blanket', description: 'Cozy sherpa-lined blanket', base_price: 49.90, product_type: 'Blanket', category_id: homeCat.category_id, picture_url: '/images/blanket-sherpa.png' },
    { name: 'Beach Towel', description: 'Large beach towel with custom print', base_price: 29.90, product_type: 'Towel', category_id: homeCat.category_id, picture_url: '/images/towel-beach.png' },
    { name: 'Hand Towel', description: 'Cotton hand towel', base_price: 12.90, product_type: 'Towel', category_id: homeCat.category_id, picture_url: '/images/towel-hand.png' },
    { name: 'Shower Curtain', description: 'Custom printed shower curtain', base_price: 34.90, product_type: 'Curtain', category_id: homeCat.category_id, picture_url: '/images/showercurtain.png' },
    { name: 'Canvas Print', description: 'Gallery wrapped canvas print', base_price: 29.90, product_type: 'Canvas', category_id: homeCat.category_id, picture_url: '/images/canvas.png' },
    { name: 'Large Canvas', description: 'Large gallery canvas print', base_price: 49.90, product_type: 'Canvas', category_id: homeCat.category_id, picture_url: '/images/canvas-large.png' },
    { name: 'Framed Print', description: 'Framed wall art print', base_price: 34.90, product_type: 'Frame', category_id: homeCat.category_id, picture_url: '/images/framedprint.png' },
    { name: 'Metal Print', description: 'HD metal wall art', base_price: 44.90, product_type: 'Print', category_id: homeCat.category_id, picture_url: '/images/metalprint.png' },
    { name: 'Wall Clock', description: 'Custom wall clock', base_price: 24.90, product_type: 'Clock', category_id: homeCat.category_id, picture_url: '/images/wallclock.png' },
    { name: 'Doormat', description: 'Custom printed welcome mat', base_price: 24.90, product_type: 'Mat', category_id: homeCat.category_id, picture_url: '/images/doormat.png' },
    { name: 'Bath Mat', description: 'Soft memory foam bath mat', base_price: 19.90, product_type: 'Mat', category_id: homeCat.category_id, picture_url: '/images/bathmat.png' },
    { name: 'Area Rug', description: 'Custom printed area rug', base_price: 59.90, product_type: 'Rug', category_id: homeCat.category_id, picture_url: '/images/rug.png' },
    { name: 'Magnet', description: 'Custom refrigerator magnet', base_price: 3.90, product_type: 'Magnet', category_id: homeCat.category_id, picture_url: '/images/magnet.png' },
    { name: 'Ornament', description: 'Custom ceramic ornament', base_price: 7.90, product_type: 'Ornament', category_id: homeCat.category_id, picture_url: '/images/ornament.png' },
    { name: 'Candle', description: 'Scented candle with custom label', base_price: 14.90, product_type: 'Candle', category_id: homeCat.category_id, picture_url: '/images/candle.png' },

    // Tech
    { name: 'Phone Grip', description: 'PopSocket-style phone grip', base_price: 9.90, product_type: 'Phone Accessory', category_id: techCat.category_id, picture_url: '/images/phonegrip.png' },
    { name: 'Phone Wallet', description: 'Stick-on phone card holder', base_price: 8.90, product_type: 'Phone Accessory', category_id: techCat.category_id, picture_url: '/images/phonewallet.png' },
    { name: 'Phone Stand', description: 'Adjustable phone stand', base_price: 12.90, product_type: 'Phone Accessory', category_id: techCat.category_id, picture_url: '/images/phonestand.png' },
    { name: 'Wireless Charger', description: 'Custom printed wireless charger', base_price: 24.90, product_type: 'Charger', category_id: techCat.category_id, picture_url: '/images/wirelesscharger.png' },
    { name: 'Power Bank', description: 'Portable power bank with custom print', base_price: 29.90, product_type: 'Charger', category_id: techCat.category_id, picture_url: '/images/powerbank.png' },
    { name: 'USB Drive', description: 'Custom USB flash drive', base_price: 11.90, product_type: 'Storage', category_id: techCat.category_id, picture_url: '/images/usbdrive.png' },
    { name: 'Earbuds Case', description: 'Case for wireless earbuds', base_price: 12.90, product_type: 'Case', category_id: techCat.category_id, picture_url: '/images/earbudscase.png' },
    { name: 'Tablet Case', description: 'Protective tablet sleeve', base_price: 24.90, product_type: 'Case', category_id: techCat.category_id, picture_url: '/images/tabletcase.png' },
    { name: 'Webcam Cover', description: 'Privacy webcam cover set', base_price: 4.90, product_type: 'Privacy', category_id: techCat.category_id, picture_url: '/images/webcamcover.png' },
    { name: 'Cable Organizer', description: 'Custom cable management clips', base_price: 6.90, product_type: 'Organizer', category_id: techCat.category_id, picture_url: '/images/cableorganizer.png' },
  ];

  for (const product of products) {
    const exists = await db.get('SELECT product_id FROM Product WHERE name = ?', [product.name]);
    if (!exists) {
      await db.run(
        'INSERT INTO Product (name, description, base_price, product_type, category_id, picture_url) VALUES (?, ?, ?, ?, ?, ?)',
        [product.name, product.description, product.base_price, product.product_type, product.category_id, product.picture_url]
      );
      console.log(`Inserted product: ${product.name}`);
    }
  }

  console.log('Database seeding complete.');
}

// Run if executed directly
seedDatabase().catch(console.error);
