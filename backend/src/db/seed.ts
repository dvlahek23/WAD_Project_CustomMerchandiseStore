import { db } from './initDb';

export async function seedDatabase() {
  await db.ready();

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

  console.log('Database seeding complete.');
}

seedDatabase().catch(console.error);
