import { hashPassword, verifyPassword } from "../utils/password";

describe("password utils", () => {
  it("produce un hash diverso dalla password in chiaro", async () => {
    const hash = await hashPassword("supersegreta123");
    expect(hash).not.toBe("supersegreta123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifica correttamente una password valida", async () => {
    const hash = await hashPassword("supersegreta123");
    const valid = await verifyPassword("supersegreta123", hash);
    expect(valid).toBe(true);
  });

  it("rifiuta una password errata", async () => {
    const hash = await hashPassword("supersegreta123");
    const valid = await verifyPassword("password_sbagliata", hash);
    expect(valid).toBe(false);
  });

  it("produce hash diversi per la stessa password (salt randomico)", async () => {
    const hash1 = await hashPassword("stessapassword");
    const hash2 = await hashPassword("stessapassword");
    expect(hash1).not.toBe(hash2);
  });
});
