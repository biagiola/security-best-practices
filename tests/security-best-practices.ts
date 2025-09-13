import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SecurityBestPractices } from "../target/types/security_best_practices";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("security-best-practices", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.securityBestPractices as Program<SecurityBestPractices>;
  const provider = anchor.AnchorProvider.env();

  // Helper function to get config PDA
  const getConfigPDA = () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];
  };

  // Helper function to initialize config
  const initializeConfig = async (admin: PublicKey, payerKeypair: Keypair) => {
    const configPDA = getConfigPDA();
    
    // we set some data on the blockchain so we need to sign
    const tx = await program.methods
      .initializeConfig(admin)
      .accounts({ 
        payer: payerKeypair.publicKey
      })
      .signers([payerKeypair])
      .rpc();
    
    return { tx, configPDA };
  };

  describe("Vulnerability Tests - update_config_bad", () => {
    let adminKeypair: Keypair;
    let maliciousKeypair: Keypair;
    let configPDA: PublicKey;

    before(async () => {
      // Create fresh keypairs for each test
      adminKeypair = Keypair.generate();
      maliciousKeypair = Keypair.generate();

      console.log('adminKeypair', adminKeypair.publicKey.toBase58());
      console.log('maliciousKeypair', maliciousKeypair.publicKey.toBase58());
      
      // Airdrop SOL to keypairs
      await provider.connection.requestAirdrop(adminKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      await provider.connection.requestAirdrop(maliciousKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

      // Wait for airdrops to confirm
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Initialize config with admin
      const result = await initializeConfig(adminKeypair.publicKey, adminKeypair);
      configPDA = result.configPDA;
    });

    it("✅ Should allow legitimate admin to update config", async () => {
      // Admin should be able to update the config
      const updateTx = await program.methods
        .updateConfigBad(42)
        .accounts({ 
          admin: adminKeypair.publicKey
        })
        .signers([adminKeypair])
        .rpc();

      console.log("✅ Admin update transaction:", updateTx);

      // Verify the update
      const configAccount = await program.account.config.fetch(configPDA);
      expect(configAccount.value).to.equal(42);
      expect(configAccount.admin.toString()).to.equal(adminKeypair.publicKey.toString());
    });

    it("VULNERABILITY: Should allow ANY signer to update config (this is the bug!)", async () => {
      // This test demonstrates the vulnerability - any person can sign to update the config
      // even if they're not the authorized admin
      
      console.log("🔍 Testing vulnerability with malicious user...");
      console.log("Authorized admin:", adminKeypair.publicKey.toString());
      console.log("Malicious user:", maliciousKeypair.publicKey.toString());

      try {
        const maliciousUpdateTx = await program.methods
          .updateConfigBad(99) // Malicious value
          .accounts({ 
            admin: maliciousKeypair.publicKey // Using malicious keypair as admin
          })
          .signers([maliciousKeypair])
          .rpc();

        console.log("🚨 VULNERABILITY EXPLOITED! Malicious update succeeded:", maliciousUpdateTx);

        // Verify the malicious update worked
        const configAccount = await program.account.config.fetch(configPDA);
        expect(configAccount.value).to.equal(99); // Value was changed by malicious user!
        expect(configAccount.admin.toString()).to.equal(adminKeypair.publicKey.toString()); // But admin is still the original

        console.log("🚨 Config value changed to:", configAccount.value);
        console.log("🚨 Original admin is still:", configAccount.admin.toString());
        console.log("🚨 But malicious user was able to update the config!");

      } catch (error) {
        // If this fails, it means the vulnerability is fixed
        console.log("✅ Vulnerability is fixed - malicious update was rejected");
        throw new Error("Expected vulnerability to be exploitable, but it was rejected");
      }
    });

    // it("❌ Should reject unsigned transactions", async () => {
    //   // This should fail because no signature is provided
    //   try {
    //     await program.methods
    //       .updateConfigBad(50)
    //       .accounts({ 
    //         admin: adminKeypair.publicKey
    //       })
    //       // No signers provided - this should fail
    //       .rpc();
        
    //     throw new Error("Expected transaction to fail without signature");
    //   } catch (error) {
    //     console.log("✅ Correctly rejected unsigned transaction:", error.message);
    //     expect(error.message).to.include("Signature verification failed");
    //   }
    // });
  });

  // describe("Setup and Initialization Tests", () => {
  //   it("Should initialize config correctly", async () => {
  //     const adminKeypair = Keypair.generate();
  //     await provider.connection.requestAirdrop(adminKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
  //     await new Promise(resolve => setTimeout(resolve, 1000));

  //     const { tx, configPDA } = await initializeConfig(adminKeypair.publicKey, adminKeypair);
      
  //     console.log("Initialization transaction:", tx);

  //     // Verify initialization
  //     const configAccount = await program.account.config.fetch(configPDA);
  //     expect(configAccount.admin.toString()).to.equal(adminKeypair.publicKey.toString());
  //     expect(configAccount.value).to.equal(0);
  //   });
  // });
});
