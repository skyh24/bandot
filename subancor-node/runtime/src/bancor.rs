use support::{decl_storage, decl_module, decl_event, ensure,
    StorageValue, StorageMap, dispatch::Result};
use system::ensure_signed;
use runtime_primitives::traits::As;

pub trait Trait: balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_event!(
    pub enum Event<T>
    where 
        <T as system::Trait>::AccountId,
    {
        Created(AccountId, u128, u128, u64),
        Buy(AccountId, u128, u128),
        Sell(AccountId, u128, u128),
    }
);

decl_storage! {
    trait Store for Module<T: Trait> as BancorStorage {
        Base get(base_supply): u128;
        Token get(token_supply): u128;
        Cw get(cw1k): u64;
        Admin get(admin): T::AccountId;
        OwnedToken get(owned_token): map T::AccountId => u128;//T::Balance;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;

        fn set_bancor(origin, init_base:u128, init_token:u128, init_cw1k:u64) -> Result {
            let sender = ensure_signed(origin)?;

            <Base<T>>::put(init_base);
            <Token<T>>::put(init_token);
            <Cw<T>>::put(init_cw1k);
            <Admin<T>>::put(&sender);

            //let token = <T::Balance as As<u64>>::sa(init_token as u64);
            <OwnedToken<T>>::insert(&sender, init_token);

            Self::deposit_event(RawEvent::Created(sender, init_base, init_token, init_cw1k));
            Ok(())
        }

        fn buy(origin, base: u128, token: u128) -> Result{
            let sender = ensure_signed(origin)?;

            let base_sup = Self::base_supply();
            let token_sup = Self::token_supply();
            let admin = Self::admin();
            let admin_token = Self::owned_token(&admin);
            let sender_token = Self::owned_token(&sender);
            ensure!(admin_token >= token, "Not enough balance.");

            <Base<T>>::put(base_sup + base);
            <Token<T>>::put(token_sup - token);
            <OwnedToken<T>>::insert(&admin, admin_token - token);
            <OwnedToken<T>>::insert(&sender, sender_token + token);

            Self::deposit_event(RawEvent::Buy(sender, base, token));

            Ok(())
        }

        fn sell(origin, base: u128, token: u128) -> Result {
            let sender = ensure_signed(origin)?;
            let sender_token = Self::owned_token(&sender);
            ensure!(sender_token >= token, "Not enough balance.");

            let base_sup = Self::base_supply();
            let token_sup = Self::token_supply();
            let admin = Self::admin();
            let admin_token = Self::owned_token(&admin);

            <Base<T>>::put(base_sup - base);
            <Token<T>>::put(token_sup + token);
            <OwnedToken<T>>::insert(&admin, admin_token + token);
            <OwnedToken<T>>::insert(&sender, sender_token - token);
            
            Self::deposit_event(RawEvent::Sell(sender, base, token));
            Ok(())
        }
    }
}
