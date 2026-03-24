/**
 * seed_superadmin.js
  * Creates the initial super-admin account.
   *
    * Usage:
     *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=changeme node seed_superadmin.js
      *
       * If env vars are not set, defaults below are used (change before production!).
        */

        require('dotenv').config();
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');

        const prisma = new PrismaClient();

        const EMAIL     = process.env.ADMIN_EMAIL    || 'admin@example.com';
        const PASSWORD  = process.env.ADMIN_PASSWORD || 'changeme123!';
        const FIRSTNAME = process.env.ADMIN_FIRST    || 'Super';
        const LASTNAME  = process.env.ADMIN_LAST     || 'Admin';

        async function main() {
          const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
            if (existing) {
                console.log(`Super-admin already exists: ${EMAIL} (id=${existing.id})`);
                    return;
                      }
                        const hashed = await bcrypt.hash(PASSWORD, 12);
                          const user   = await prisma.user.create({
                              data: {
                                    email:     EMAIL,
                                          password:  hashed,
                                                firstName: FIRSTNAME,
                                                      lastName:  LASTNAME,
                                                            role:      'super-admin',
                                                                  active:    true,
                                                                      },
                                                                        });
                                                                          console.log(`Super-admin created: ${user.email} (id=${user.id})`);
                                                                          }

                                                                          main()
                                                                            .catch(console.error)
                                                                              .finally(() => prisma.$disconnect());
                                                                              
