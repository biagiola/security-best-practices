use anchor_lang::prelude::*;

declare_id!("99oQb2on2BgNb6Sg2VXWiBXmQoxQWi2CScT3K5UYQJ4K");

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: Only the admin can perform this action")]
    Unauthorized,
}

#[program]
pub mod security_best_practices {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, admin: Pubkey) -> Result<()> {
        msg!("Initializing config account");
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.value = 0; // Initialize with default value
        Ok(())
    }

    pub fn update_config_bad(ctx: Context<UpdateConfig>, data: u8) -> Result<()> {
        msg!("Greetings update_config_bad: {:?}", ctx.program_id);
        msg!("ctx.accounts.config", ctx.accounts.config);
        msg!("ctx.accounts.admin", ctx.accounts.admin);
        msg!("ctx.accounts.andrew", ctx.accounts.andrew);

        if !ctx.accounts.admin.is_signer {
            return Err(ProgramError::MissingRequiredSignature.into());
        }
    
        let config = &mut ctx.accounts.config;
        config.value = data;
        Ok(())

        // The problem here is that the function only checks if someone signed,
        // but not who signed. Any random person who signs the transaction can
        // update the config, as long as they pass their public key as the admin
        // account. The program doesn't verify if that signer is actually the
        // authorized admin stored in the config account.
    }

    pub fn update_config_good(ctx: Context<UpdateConfig>, data: u8) -> Result<()> {
        // Check if admin is signer (existing check)
        if !ctx.accounts.admin.is_signer {
            return Err(ProgramError::MissingRequiredSignature.into());
        }
        
        // MISSING: Check if signer is the authorized admin
        if ctx.accounts.admin.key() != ctx.accounts.config.admin {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        let config = &mut ctx.accounts.config;
        config.value = data;
        Ok(())
    }
}

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub value: u8
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1, // discriminator + pubkey + u8
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>
}
