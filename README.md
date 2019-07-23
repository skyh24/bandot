# sub-bancor

cd subancor-node
./scripts/init.sh
./scripts/build.sh
cargo build --release

# see my.sh

cd ../

cd subancor-ui
yarn install
yarn run dev