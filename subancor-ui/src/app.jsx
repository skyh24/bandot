import React from 'react';
require('semantic-ui-css/semantic.min.css');
import { Icon, Accordion, List, Checkbox, Label, Header, Segment, Divider, Button } from 'semantic-ui-react';
import { Bond, TransformBond } from 'oo7';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import {
	calls, runtime, chain, system, runtimeUp, ss58Decode, ss58Encode, pretty,
	addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId
} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { AccountIdBond, SignerBond } from './AccountIdBond.jsx';
import { BalanceBond } from './BalanceBond.jsx';
import { InputBond } from './InputBond.jsx';
import { TransactButton } from './TransactButton.jsx';
import { FileUploadBond } from './FileUploadBond.jsx';
import { StakingStatusLabel } from './StakingStatusLabel';
import { WalletList, SecretItem } from './WalletList';
import { AddressBookList } from './AddressBookList';
import { TransformBondButton } from './TransformBondButton';
import { Pretty } from './Pretty';

export class App extends ReactiveComponent {
	constructor() {
		super([], { ensureRuntime: runtimeUp })

		// For debug only.
		window.runtime = runtime;
		window.secretStore = secretStore;
		window.addressBook = addressBook;
		window.chain = chain;
		window.calls = calls;
		window.system = system;
		window.that = this;
		window.metadata = metadata;
	}

	readyRender() {
		return (<div>
			<Heading />
			<BancorSegment />
			<WalletSegment />
			<Divider hidden />
			<AddressBookSegment />
			<Divider hidden />
			<FundingSegment />
			<Divider hidden />
			<UpgradeSegment />
			<Divider hidden />
			<PokeSegment />
			<Divider hidden />
			<TransactionsSegment />
		</div>);
	}
}

class Heading extends React.Component {
	render() {
		return <div>
			<If
				condition={nodeService().status.map(x => !!x.connected)}
				then={<Label>Connected <Label.Detail>
					<Pretty className="value" value={nodeService().status.sub('connected')} />
				</Label.Detail></Label>}
				else={<Label>Not connected</Label>}
			/>
			<Label>Name <Label.Detail>
				<Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
			</Label.Detail></Label>
			<Label>Chain <Label.Detail>
				<Pretty className="value" value={system.chain} />
			</Label.Detail></Label>
			<Label>Runtime <Label.Detail>
				<Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
					<Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
				)
			</Label.Detail></Label>
			<Label>Height <Label.Detail>
				<Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
			</Label.Detail></Label>
			<Label>Authorities <Label.Detail>
				<Rspan className="value">{
					runtime.core.authorities.mapEach((a, i) => <Identicon key={bytesToHex(a) + i} account={a} size={16} />)
				}</Rspan>
			</Label.Detail></Label>
			<Label>Total issuance <Label.Detail>
				<Pretty className="value" value={runtime.balances.totalIssuance} />
			</Label.Detail></Label>
		</div>
	}
}

class WalletSegment extends React.Component {
	constructor() {
		super()
		this.seed = new Bond;
		this.seedAccount = this.seed.map(s => s ? secretStore().accountFromPhrase(s) : undefined)
		this.seedAccount.use()
		this.name = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }}>
			<Header as='h2'>
				<Icon name='key' />
				<Header.Content>
					Wallet
					<Header.Subheader>Manage your secret keys</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>seed</div>
				<InputBond
					bond={this.seed}
					reversible
					placeholder='Some seed for this key'
					validator={n => n || null}
					action={<Button content="Another" onClick={() => this.seed.trigger(secretStore().generateMnemonic())} />}
					iconPosition='left'
					icon={<i style={{ opacity: 1 }} className='icon'><Identicon account={this.seedAccount} size={28} style={{ marginTop: '5px' }} /></i>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.name}
					placeholder='A name for this key'
					validator={n => n ? secretStore().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Create'
						transform={(name, seed) => secretStore().submit(seed, name)}
						args={[this.name, this.seed]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<WalletList />
			</div>
		</Segment>
	}
}

class AddressBookSegment extends React.Component {
	constructor() {
		super()
		this.nick = new Bond
		this.lookup = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='search' />
				<Header.Content>
					Address Book
					<Header.Subheader>Inspect the status of any account and name it for later use</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>lookup account</div>
				<AccountIdBond bond={this.lookup} />
				<If condition={this.lookup.ready()} then={<div>
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.lookup)} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.lookup)} />
						</Label.Detail>
					</Label>
					<If condition={runtime.indices.tryIndex(this.lookup, null).map(x => x !== null)} then={
						<Label>Short-form
							<Label.Detail>
								<Rspan>{runtime.indices.tryIndex(this.lookup).map(i => ss58Encode(i) + ` (index ${i})`)}</Rspan>
							</Label.Detail>
						</Label>
					} />
					<Label>Address
						<Label.Detail>
							<Pretty value={this.lookup} />
						</Label.Detail>
					</Label>
				</div>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.nick}
					placeholder='A name for this address'
					validator={n => n ? addressBook().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Add'
						transform={(name, account) => { addressBook().submit(account, name); return true }}
						args={[this.nick, this.lookup]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<AddressBookList />
			</div>
		</Segment>
	}
}

class FundingSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond;
		this.amount = new Bond;
		this.destination = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Send Funds
					<Header.Subheader>Send funds from your account to another</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>to</div>
				<AccountIdBond bond={this.destination} />
				<If condition={this.destination.ready()} then={
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.destination)} />
						</Label.Detail>
					</Label>
				} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>amount</div>
				<BalanceBond bond={this.amount} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.balances.transfer(runtime.indices.tryIndex(this.destination), this.amount),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class UpgradeSegment extends React.Component {
	constructor() {
		super()
		this.conditionBond = runtime.metadata.map(m =>
			m.modules && m.modules.some(o => o.name === 'sudo')
			|| m.modules.some(o => o.name === 'upgrade_key')
		)
		this.runtime = new Bond
	}
	render() {
		return <If condition={this.conditionBond} then={
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Runtime Upgrade
						<Header.Subheader>Upgrade the runtime using the UpgradeKey module</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}></div>
				<FileUploadBond bond={this.runtime} content='Select Runtime' />
				<TransactButton
					content="Upgrade"
					icon='warning'
					tx={{
						sender: runtime.sudo
							? runtime.sudo.key
							: runtime.upgrade_key.key,
						call: calls.sudo
							? calls.sudo.sudo(calls.consensus.setCode(this.runtime))
							: calls.upgrade_key.upgrade(this.runtime)
					}}
				/>
			</Segment>
		} />
	}
}

class PokeSegment extends React.Component {
	constructor () {
		super()
		this.storageKey = new Bond;
		this.storageValue = new Bond;
	}
	render () {
		return <If condition={runtime.metadata.map(m => m.modules && m.modules.some(o => o.name === 'sudo'))} then={
			<Segment style={{margin: '1em'}} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Poke
						<Header.Subheader>Set a particular key of storage to a particular value</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{paddingBottom: '1em'}}></div>
				<InputBond bond={this.storageKey} placeholder='Storage key e.g. 0xf00baa' />
				<InputBond bond={this.storageValue} placeholder='Storage value e.g. 0xf00baa' />
				<TransactButton
					content="Poke"
					icon='warning'
					tx={{
						sender: runtime.sudo ? runtime.sudo.key : null,
						call: calls.sudo ? calls.sudo.sudo(calls.consensus.setStorage([[this.storageKey.map(hexToBytes), this.storageValue.map(hexToBytes)]])) : null
					}}
				/>
			</Segment>
		}/>		
	}
}

class TransactionsSegment extends React.Component {
	constructor () {
		super()

		this.txhex = new Bond
	}

	render () {
		return <Segment style={{margin: '1em'}} padded>
			<Header as='h2'>
				<Icon name='certificate' />
				<Header.Content>
					Transactions
					<Header.Subheader>Send custom transactions</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>Custom Transaction Data</div>
					<InputBond bond={this.txhex}/>
				</div>
				<TransactButton tx={this.txhex.map(hexToBytes)} content="Publish" icon="sign in" />
			</div>
		</Segment>
	}
}

class BancorSegment extends React.Component {
	constructor() {
		super()
		this.bcAcc = new Bond
		this.base = new Bond
		this.token = new Bond
		this.init_base = new Bond
		this.init_token = new Bond
		this.cw1k = new Bond
	}

	render() {
		return <Segment style={{margin: '1em'}} padded>
			<Header as='h2'>
				<Icon name='certificate' />
				<Header.Content>
					Bandot
					<Header.Subheader>
						<Label>base_sup:
							<Label.Detail> <Pretty value={runtime.bancor.base} /> </Label.Detail>
						</Label>
						<Label>token_sup:
							<Label.Detail> <Pretty value={runtime.bancor.token} /> </Label.Detail>
						</Label>
						<Label>cw1k:
							<Label.Detail> <Pretty value={runtime.bancor.cw} /> </Label.Detail>
						</Label>
						<Label>admin:
							<Label.Detail> <Pretty value={runtime.bancor.admin} /> </Label.Detail>
						</Label>
						{/* base_sup: <Pretty value={runtime.bancor.base} /> | 
						token_supp: <Pretty value={runtime.bancor.token} /> |
						cw1k:  <Pretty value={runtime.bancor.cw} /> <br/>
						admin: <Pretty value={runtime.bancor.admin} />  */}
					</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<SignerBond bond={this.bcAcc} /> 
				<If condition={this.bcAcc.ready()} then={ <div>  
					<Label>Owned: 
						<Label.Detail> <Pretty value={runtime.bancor.ownedToken(this.bcAcc)} /> </Label.Detail>
					</Label>
					
				</div> } />
			</div>

			<div style={{ paddingBottom: '1em' }}> 
				<InputBond bond={this.base} placeholder="base" />
				<InputBond bond={this.token} placeholder="token" />
				<TransactButton
					content="Buy"
					icon='paw'
					tx={{
						sender: runtime.indices.tryIndex(this.bcAcc),
						call: calls.bancor.buy(
							runtime.indices.tryIndex(this.base), 
							runtime.indices.tryIndex(this.token))
					}} 
				/>
				
				<TransactButton
					content="Sell"
					icon='paw'
					tx={{
						sender: runtime.indices.tryIndex(this.bcAcc),
						call: calls.bancor.sell(
							runtime.indices.tryIndex(this.base), 
							runtime.indices.tryIndex(this.token))
					}}
				/> 
			</div>

			<div style={{ paddingBottom: '1em' }}>
				<InputBond bond={this.init_base} placeholder='base >1k, : 50000' />
				<InputBond bond={this.init_token} placeholder='token >1k :5000000 ' />
				<InputBond bond={this.cw1k} placeholder='cw <1k :500' />
				<TransactButton
					content="Create"
					icon='paw'
					tx={{
						sender: runtime.indices.tryIndex(this.bcAcc),
						call: calls.bancor.setBancor(
							runtime.indices.tryIndex(this.init_base), 
							runtime.indices.tryIndex(this.init_token),
							runtime.indices.tryIndex(this.cw1k))
					}}
				/> 
			</div>

			<div style={{ paddingBottom: '1em' }}>
				
			</div>

		</Segment>
	}
}

var base
var token
var cw
function buyBancor(amount) {
	runtime.bancor.base.then(b => base = b)
	runtime.bancor.token.then(t => token = t)
	runtime.bancor.cw.then(c => cw = c / 1000.0)
	console.log("base:" + base)
	console.log("token:" + token)
	console.log("cw:" + cw)

	R = parseFloat(token)
	C = parseFloat(base)
	F = parseFloat(cw)
	T = parseFloat(amount)
	
	E = -R * (1.0 - Math.pow(1.0 + T/C, F))
	console.log("E:" + E)
	return parseInt(E)
} 

function sellBancor(amount) {
	runtime.bancor.base.then(b => base = b)
	runtime.bancor.token.then(t => token = t)
	runtime.bancor.cw.then(c => cw = c / 1000.0)
	console.log("base:" + base)
	console.log("token:" + token)
	console.log("cw:" + cw)

	R = parseFloat(token)
	C = parseFloat(base)
	F = parseFloat(1.0/cw)
	E = parseFloat(-amount)

	T = C * (Math.pow(1.0 + E/R, F) -1)
	return parseInt(T)
}

