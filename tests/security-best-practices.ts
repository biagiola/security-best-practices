import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SecurityBestPractices } from "../target/types/security_best_practices";

describe("security-best-practices", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.securityBestPractices as Program<SecurityBestPractices>;

  it("Is initialized!", async () => {
    // initialize Config account
    const provider = anchor.AnchorProvider.env();
    const adminKeypair = provider.wallet.publicKey;

    const tx = await program.methods
    .initializeConfig(adminKeypair)
    .accounts({ payer: adminKeypair })
    .rpc();

    console.log("Your transaction signature", tx);

    // update Config account
    const updateTx = await program.methods
    .updateConfigBad(1)
    .accounts({  admin: adminKeypair })
    .rpc();

    console.log("Update transaction signature", updateTx);
  });
});
