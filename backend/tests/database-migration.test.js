import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migrationsDirectory = fileURLToPath(
  new URL("../../supabase/migrations/", import.meta.url)
);

const bootstrapSql = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create schema storage;
  create schema extensions;

  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );

  create function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );

  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null references storage.buckets(id),
    name text not null,
    owner_id text
  );

  create function storage.foldername(name text)
  returns text[]
  language sql
  immutable
  as $$
    select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)]
  $$;

  create publication supabase_realtime;
`;

const FARMER_ID = "10000000-0000-4000-8000-000000000001";
const BUYER_ID = "10000000-0000-4000-8000-000000000002";
const STRANGER_ID = "10000000-0000-4000-8000-000000000003";

describe("Supabase migrations", () => {
  let database;

  beforeAll(async () => {
    database = new PGlite();
    await database.exec(bootstrapSql);

    const migrationNames = (await readdir(migrationsDirectory))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    for (const migrationName of migrationNames) {
      const migration = await readFile(
        join(migrationsDirectory, migrationName),
        "utf8"
      );
      const portableMigration = migration.replace(
        "create extension if not exists pgcrypto with schema extensions;",
        ""
      );

      await database.exec(portableMigration);
    }

    const users = [
      {
        id: FARMER_ID,
        metadata: {
          full_name: "Ada Farmer",
          phone: "+2348011111111",
          state: "Enugu",
          city: "Nsukka",
          role: "farmer"
        }
      },
      {
        id: BUYER_ID,
        metadata: {
          full_name: "Bola Buyer",
          phone: "+2348022222222",
          state: "Lagos",
          city: "Ikeja",
          role: "buyer"
        }
      },
      {
        id: STRANGER_ID,
        metadata: {
          full_name: "Chidi Buyer",
          phone: "+2348033333333",
          state: "Abia",
          city: "Umuahia",
          role: "buyer"
        }
      }
    ];

    for (const user of users) {
      await database.query(
        `
          insert into auth.users (id, email, raw_user_meta_data)
          values ($1, $2, $3::jsonb)
        `,
        [
          user.id,
          `${user.metadata.full_name.toLowerCase().replaceAll(" ", ".")}@example.com`,
          JSON.stringify(user.metadata)
        ]
      );
    }

    await database.query(
      `insert into public.admin_memberships (user_id) values ($1)`,
      [FARMER_ID]
    );
  }, 30_000);

  afterAll(async () => {
    await database?.close();
  });

  it("creates the complete application schema", async () => {
    const result = await database.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    expect(result.rows.map(({ table_name: tableName }) => tableName)).toEqual([
      "admin_actions",
      "admin_memberships",
      "conversations",
      "messages",
      "product_images",
      "products",
      "profile_private",
      "profiles",
      "user_reports"
    ]);
  });

  it("enables row-level security on every application table", async () => {
    const result = await database.query(`
      select count(*)::integer as enabled_count
      from pg_class
      where oid in (
        'public.profiles'::regclass,
        'public.profile_private'::regclass,
        'public.products'::regclass,
        'public.product_images'::regclass,
        'public.conversations'::regclass,
        'public.messages'::regclass,
        'public.admin_actions'::regclass,
        'public.admin_memberships'::regclass,
        'public.user_reports'::regclass
      )
      and relrowsecurity
    `);

    expect(result.rows[0].enabled_count).toBe(9);
  });

  it("creates public marketplace and private chat image buckets with strict limits", async () => {
    const result = await database.query(`
      select id, file_size_limit, allowed_mime_types
      from storage.buckets
      order by id
    `);

    expect(result.rows).toEqual([
      {
        id: "avatars",
        file_size_limit: 5_242_880,
        allowed_mime_types: ["image/webp"]
      },
      {
        id: "chat-media",
        file_size_limit: 5_242_880,
        allowed_mime_types: ["image/webp"]
      },
      {
        id: "product-images",
        file_size_limit: 8_388_608,
        allowed_mime_types: ["image/webp"]
      }
    ]);
  });

  it("enforces the complete protected marketplace lifecycle", async () => {
    const profileCount = await database.query(`
      select count(*)::integer as count from public.profiles
    `);
    expect(profileCount.rows[0].count).toBe(3);

    await setAuthenticatedUser(database, BUYER_ID);
    const visiblePrivateProfiles = await database.query(`
      select user_id from public.profile_private order by user_id
    `);
    expect(visiblePrivateProfiles.rows).toEqual([{ user_id: BUYER_ID }]);

    const updatedBuyer = await database.query(`
      select public.update_my_profile(
        'Bola Market Buyer',
        '+2348022222222',
        '14 Marina Road',
        'Lagos',
        'Surulere'
      ) as profile
    `);
    expect(updatedBuyer.rows[0].profile).toMatchObject({
      full_name: "Bola Market Buyer",
      phone: "+2348022222222",
      address: "14 Marina Road",
      city: "Surulere"
    });
    await resetRole(database);

    await setAuthenticatedUser(database, FARMER_ID);
    await database.query(`
      select public.update_my_profile(
        'Ada Farmer',
        '+2348011111111',
        '8 Market Road',
        'Enugu',
        'Nsukka'
      )
    `);
    const productResult = await database.query(`
      insert into public.products (
        farmer_id,
        title,
        description,
        category,
        price,
        unit,
        available_quantity,
        state,
        city
      )
      values (
        '${FARMER_ID}',
        'Fresh yellow maize',
        'Newly harvested yellow maize ready for collection.',
        'grains',
        35000,
        'bag',
        12,
        'Enugu',
        'Nsukka'
      )
      returning id
    `);
    const productId = productResult.rows[0].id;

    await expect(
      database.query(`
        update public.products set status = 'active' where id = '${productId}'
      `)
    ).rejects.toThrow(/requires at least one image/);

    for (let order = 0; order < 5; order += 1) {
      await database.query(`
        insert into public.product_images (
          product_id,
          storage_path,
          display_order
        )
        values (
          '${productId}',
          '${FARMER_ID}/${productId}/image-${order}.webp',
          ${order}
        )
      `);
    }

    await expect(
      database.query(`
        insert into public.product_images (
          product_id,
          storage_path,
          display_order
        )
        values (
          '${productId}',
          '${FARMER_ID}/${productId}/image-6.webp',
          0
        )
      `)
    ).rejects.toThrow();

    await database.query(`
      update public.products set status = 'active' where id = '${productId}'
    `);
    const soldOutProduct = await database.query(`
      update public.products
      set status = 'sold_out'
      where id = '${productId}'
      returning status
    `);
    expect(soldOutProduct.rows).toEqual([{ status: "sold_out" }]);
    await resetRole(database);

    await database.exec("set role anon");
    const publicProducts = await database.query(`
      select id, status from public.products
    `);
    expect(publicProducts.rows).toEqual([
      { id: productId, status: "sold_out" }
    ]);

    const publicFarmerProfile = await database.query(`
      select full_name, phone, address, city, state
      from public.get_public_farmer_profile('${FARMER_ID}')
    `);
    expect(publicFarmerProfile.rows).toEqual([
      {
        full_name: "Ada Farmer",
        phone: "+2348011111111",
        address: "8 Market Road",
        city: "Nsukka",
        state: "Enugu"
      }
    ]);
    await resetRole(database);

    await setAuthenticatedUser(database, BUYER_ID);
    const firstConversation = await database.query(`
      select * from public.start_conversation('${productId}')
    `);
    const secondConversation = await database.query(`
      select * from public.start_conversation('${productId}')
    `);
    const conversationId = firstConversation.rows[0].conversation_id;

    expect(firstConversation.rows[0].created).toBe(true);
    expect(secondConversation.rows[0]).toEqual({
      conversation_id: conversationId,
      created: false
    });

    const buyerMessage = await database.query(`
      select (public.send_message(
        '${conversationId}',
        '  Is this maize still available?  '
      )).body
    `);
    expect(buyerMessage.rows[0].body).toBe("Is this maize still available?");

    await resetRole(database);
    await database.query(`
      insert into storage.objects (name, bucket_id, owner_id)
      values (
        '${BUYER_ID}/${conversationId}/maize-photo.webp',
        'chat-media',
        '${BUYER_ID}'
      )
    `);
    await setAuthenticatedUser(database, BUYER_ID);

    const buyerImageMessage = await database.query(`
      select
        (message).message_type,
        (message).body,
        (message).media_path,
        (message).media_mime_type,
        (message).media_size,
        (message).media_original_name
      from (
        select public.send_message(
          '${conversationId}',
          null,
          null,
          '${BUYER_ID}/${conversationId}/maize-photo.webp',
          'image/webp',
          1024,
          'maize-photo.png'
        ) as message
      ) sent
    `);
    expect(buyerImageMessage.rows).toEqual([
      {
        message_type: "image",
        body: null,
        media_path: `${BUYER_ID}/${conversationId}/maize-photo.webp`,
        media_mime_type: "image/webp",
        media_size: 1024,
        media_original_name: "maize-photo.png"
      }
    ]);
    await resetRole(database);

    await setAuthenticatedUser(database, STRANGER_ID);
    const strangerMessages = await database.query(`
      select id from public.messages
    `);
    expect(strangerMessages.rows).toEqual([]);

    const strangerProfile = await database.query(`
      select id
      from public.get_conversation_profile('${BUYER_ID}')
    `);
    expect(strangerProfile.rows).toEqual([]);
    await resetRole(database);

    await setAuthenticatedUser(database, FARMER_ID);
    const buyerConversationProfile = await database.query(`
      select full_name, role, phone, address, city, state
      from public.get_conversation_profile('${BUYER_ID}')
    `);
    expect(buyerConversationProfile.rows).toEqual([
      {
        full_name: "Bola Market Buyer",
        role: "buyer",
        phone: "+2348022222222",
        address: "14 Marina Road",
        city: "Surulere",
        state: "Lagos"
      }
    ]);

    const roleResult = await database.query(`
      select public.switch_user_role('buyer') as result
    `);
    expect(roleResult.rows[0].result).toMatchObject({
      profile: {
        id: FARMER_ID,
        role: "buyer"
      }
    });
    expect(roleResult.rows[0].result).not.toHaveProperty(
      "archivedProductCount"
    );

    const buyerProductUpdate = await database.query(`
      update public.products
      set title = 'Buyer must not edit this product'
      where id = '${productId}'
      returning id
    `);
    expect(buyerProductUpdate.rows).toEqual([]);

    await expect(
      database.query(`
        insert into public.products (
          farmer_id,
          title,
          description,
          category,
          price,
          unit,
          available_quantity,
          state,
          city
        )
        values (
          '${FARMER_ID}',
          'Buyer listing blocked',
          'A buyer must not be able to create a new product listing.',
          'grains',
          1000,
          'kg',
          5,
          'Enugu',
          'Nsukka'
        )
      `)
    ).rejects.toThrow();

    await database.query(`
      select public.send_message(
        '${conversationId}',
        'Yes, the maize is available.'
      )
    `);

    const participantMessages = await database.query(`
      select body, message_type
      from public.messages
      order by created_at, id
    `);
    expect(participantMessages.rows).toEqual([
      {
        body: "Is this maize still available?",
        message_type: "text"
      },
      {
        body: null,
        message_type: "image"
      },
      {
        body: "Yes, the maize is available.",
        message_type: "text"
      }
    ]);
    await resetRole(database);

    await database.exec("set role anon");
    const preservedPublicProducts = await database.query(`
      select id from public.products
    `);
    expect(preservedPublicProducts.rows).toEqual([{ id: productId }]);

    const preservedSellerProfile = await database.query(`
      select id, role
      from public.profiles
      where id = '${FARMER_ID}'
    `);
    expect(preservedSellerProfile.rows).toEqual([
      { id: FARMER_ID, role: "buyer" }
    ]);
    await resetRole(database);

    await setAuthenticatedUser(database, FARMER_ID);
    await database.query(`
      select public.switch_user_role('farmer')
    `);
    const farmerProductUpdate = await database.query(`
      update public.products
      set title = 'Fresh yellow maize again'
      where id = '${productId}'
      returning title
    `);
    expect(farmerProductUpdate.rows).toEqual([
      { title: "Fresh yellow maize again" }
    ]);

    await database.query(`
      update public.products
      set status = 'archived'
      where id = '${productId}'
    `);
    await resetRole(database);

    await database.exec("set role anon");
    const archivedPublicProducts = await database.query(`
      select id from public.products
    `);
    expect(archivedPublicProducts.rows).toEqual([]);
    await resetRole(database);

    await setAuthenticatedUser(database, FARMER_ID);
    const unarchivedProduct = await database.query(`
      update public.products
      set status = 'active'
      where id = '${productId}'
      returning status
    `);
    expect(unarchivedProduct.rows).toEqual([{ status: "active" }]);

    const deletedProduct = await database.query(`
      update public.products
      set status = 'deleted'
      where id = '${productId}'
      returning status, deleted_at is not null as has_deleted_at
    `);
    expect(deletedProduct.rows).toEqual([
      { status: "deleted", has_deleted_at: true }
    ]);

    const retainedDeletedProduct = await database.query(`
      select id, status
      from public.products
      where id = '${productId}'
    `);
    expect(retainedDeletedProduct.rows).toEqual([
      { id: productId, status: "deleted" }
    ]);
    await resetRole(database);

    await database.exec("set role anon");
    const deletedPublicProducts = await database.query(`
      select id from public.products
    `);
    expect(deletedPublicProducts.rows).toEqual([]);
    await resetRole(database);
  }, 30_000);

  it("enforces reporting, account restrictions, and administrator promotion", async () => {
    await setAuthenticatedUser(database, BUYER_ID);
    const report = await database.query(`
      select public.submit_user_report(
        '${STRANGER_ID}',
        'spam',
        'This user repeatedly sent suspicious unsolicited messages.',
        null,
        null
      ) as report
    `);
    expect(report.rows[0].report).toMatchObject({ status: "open" });
    await resetRole(database);

    await setAuthenticatedUser(database, FARMER_ID);
    const dashboard = await database.query(`
      select public.admin_dashboard() as dashboard
    `);
    expect(Number(dashboard.rows[0].dashboard.metrics.totalUsers)).toBe(3);
    expect(Number(dashboard.rows[0].dashboard.metrics.openReports)).toBe(1);

    const adminCollections = await database.query(`
      select
        public.admin_search_users(null, 'all', 'all', 'all', 25, 0) as users,
        public.admin_search_products(null, 'all', 'all', 25, 0) as products,
        public.admin_search_conversations(null, 25, 0) as conversations,
        public.admin_search_reports('all', 25, 0) as reports,
        public.admin_audit_log(25, 0) as audit
    `);
    expect(Number(adminCollections.rows[0].users.total)).toBe(3);
    expect(Number(adminCollections.rows[0].products.total)).toBe(1);
    expect(Number(adminCollections.rows[0].conversations.total)).toBe(1);
    expect(Number(adminCollections.rows[0].reports.total)).toBe(1);
    expect(Number(adminCollections.rows[0].audit.total)).toBe(0);

    const conversationMessages = await database.query(`
      select public.admin_conversation_messages(
        (select id from public.conversations limit 1),
        100,
        0
      ) as conversation
    `);
    expect(Number(conversationMessages.rows[0].conversation.total)).toBe(3);

    const draftProduct = await database.query(`
      insert into public.products (
        farmer_id,
        title,
        description,
        category,
        price,
        unit,
        available_quantity,
        state,
        city
      ) values (
        '${FARMER_ID}',
        'Admin review product',
        'A draft product created to verify moderation controls.',
        'other',
        2500,
        'piece',
        3,
        'Enugu',
        'Nsukka'
      ) returning id
    `);
    const moderated = await database.query(`
      select public.admin_moderate_product(
        '${draftProduct.rows[0].id}',
        true,
        'Listing requires a policy review.'
      ) as product
    `);
    expect(moderated.rows[0].product).toMatchObject({ isHidden: true });

    const reviewedReport = await database.query(`
      select public.admin_update_report(
        '${report.rows[0].report.id}',
        'reviewing',
        'Assigned for evidence review.'
      ) as report
    `);
    expect(reviewedReport.rows[0].report).toMatchObject({ status: "reviewing" });

    const frozen = await database.query(`
      select public.admin_set_account_status(
        '${STRANGER_ID}',
        'frozen',
        'Reviewing unusual marketplace behaviour.'
      ) as account
    `);
    expect(frozen.rows[0].account).toMatchObject({ accountStatus: "frozen" });

    const promotion = await database.query(`
      select public.admin_set_membership(
        '${BUYER_ID}',
        true,
        'Trusted operations team member.'
      ) as membership
    `);
    expect(promotion.rows[0].membership).toMatchObject({ isAdmin: true });
    await resetRole(database);

    await setAuthenticatedUser(database, STRANGER_ID);
    await expect(
      database.query(`
        select public.update_my_profile(
          'Blocked Update',
          '+2348033333333',
          '12 Restricted Road',
          'Abia',
          'Umuahia'
        )
      `)
    ).rejects.toThrow(/read-only access/);
    await resetRole(database);

    await setAuthenticatedUser(database, BUYER_ID);
    const promotedDashboard = await database.query(`
      select public.admin_dashboard() as dashboard
    `);
    expect(Number(promotedDashboard.rows[0].dashboard.metrics.admins)).toBe(2);
    await resetRole(database);
  }, 30_000);
});

async function setAuthenticatedUser(database, userId) {
  await database.exec(`
    set role authenticated;
    set "request.jwt.claim.sub" = '${userId}';
  `);
}

async function resetRole(database) {
  await database.exec(`
    reset role;
    reset "request.jwt.claim.sub";
  `);
}
