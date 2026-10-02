import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTables1730545918237 implements MigrationInterface {
  name = 'InitialTables1730545918237';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "username" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying,
                "bio" character varying,
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_070157ac5f9096d1a00bab15aa" ON "user" ("username")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d0012b9482ca5b4f270e6fdb5e" ON "user" ("email")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE TABLE "session" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "createdByUserId" uuid NOT NULL,
                "updatedByUserId" uuid NOT NULL,
                "deletedByUserId" uuid,
                "hash" character varying(255) NOT NULL,
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0284cbb1b0c7d562945f8b04c3" ON "session" ("createdByUserId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9928e7e276c40aa9411a2108dd" ON "session" ("updatedByUserId")
            WHERE "deletedAt" IS NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ee5c9180c88edacae29c74a182" ON "session" ("deletedByUserId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId")
        `);
    await queryRunner.query(`
            ALTER TABLE "session"
            ADD CONSTRAINT "FK_24a9ef949f68dca0294776b6b4c" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "session"
            ADD CONSTRAINT "FK_34d861640caf9fb0d0e32ecbb97" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "session"
            ADD CONSTRAINT "FK_ee5c9180c88edacae29c74a182c" FOREIGN KEY ("deletedByUserId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "session"
            ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"
        `);
    await queryRunner.query(`
            ALTER TABLE "session" DROP CONSTRAINT "FK_ee5c9180c88edacae29c74a182c"
        `);
    await queryRunner.query(`
            ALTER TABLE "session" DROP CONSTRAINT "FK_34d861640caf9fb0d0e32ecbb97"
        `);
    await queryRunner.query(`
            ALTER TABLE "session" DROP CONSTRAINT "FK_24a9ef949f68dca0294776b6b4c"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ee5c9180c88edacae29c74a182"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9928e7e276c40aa9411a2108dd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0284cbb1b0c7d562945f8b04c3"
        `);
    await queryRunner.query(`
            DROP TABLE "session"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d0012b9482ca5b4f270e6fdb5e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_070157ac5f9096d1a00bab15aa"
        `);
    await queryRunner.query(`
            DROP TABLE "user"
        `);
  }
}
