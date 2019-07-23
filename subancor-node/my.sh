# ./scripts/build.sh
# cargo build --release

./target/release/subancor-node purge-chain --dev
./target/release/subancor-node --dev

# https://polkadot.js.org/apps/
