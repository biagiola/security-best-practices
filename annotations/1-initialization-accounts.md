1. Difference between #[account] and #[derive(Accounts)]:

#[account] is used to define the data structure that will be stored in a Solana account. In your case, 
Config
 is marked with #[account] because it represents the actual data layout that gets serialized and stored on-chain. This struct defines what fields your account will contain (admin pubkey and value).

#[derive(Accounts)] is used to define the context structure that specifies which accounts your instruction needs and their constraints. 
UpdateConfig
 uses this because it's not data being stored - it's a specification of what accounts the instruction requires and how they should be validated (like the mut, seeds, and bump constraints).

2. Do we need to initialize the Config account:

Yes, you absolutely need to initialize the Config account first. The Config struct defines the data layout, but the actual account storage space on Solana needs to be allocated and initialized before you can write to it. You're missing an initialization instruction that creates the account with the proper space allocation and sets initial values.

3. Can we name our function as we please:

Yes, you can name your instruction functions whatever you want. The name 
update_config_bad
 is perfectly valid. Anchor will automatically generate the corresponding method names in the client SDK based on your function names, converting snake_case to camelCase (so 
update_config_bad
 becomes updateConfigBad in TypeScript).