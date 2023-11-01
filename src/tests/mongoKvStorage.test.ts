import { describe, it } from 'mocha';
import * as chai from 'chai';
import { MongoKvStorage } from '../mongoKvStorage';

const expect = chai.expect;

let store: MongoKvStorage;

beforeEach(async () => {
  const url = process.env.MONGO_URL;
  const db = process.env.MONGO_DB;

  if (!url || !db) {
    throw new Error('url or db were not provided');
  }

  store = new MongoKvStorage({
    prefix: `boo${Date.now()}`,
    mongoUrl: url,
    dbName: db,
  });

  await store.connect();
});

afterEach(async () => {
  await store.disconnect();
});

describe('MongoKvStorage', async () => {
  it('can connect', async () => {
    expect(store.isConnected()).to.be.true;
  });

  it('can retrieve a collection', async () => {
    const col = await store.getCollection('foo');
    expect(col).to.be.not.null;
  });

  it('can retrieve the same collection', async () => {
    const col1 = await store.getCollection('foo');
    await col1.setValue('bar', 'xxx');
    const col2 = await store.getCollection('foo');
    expect(await col2.findByKey('bar')).to.eq('xxx');
  });
});

describe('MongoKvStorageCollection', () => {
  it('can save and retrieve a string', async () => {
    const col = await store.getCollection('foo');
    await col.setValue('bar', 'val1');
    const val = await col.findByKey('bar');
    expect(val).to.eq('val1');
  });

  it('can overwrite a string', async () => {
    const col = await store.getCollection('foo');
    await col.setValue('bar', 'val1');
    await col.setValue('bar', 'val2');
    const val = await col.findByKey('bar');
    expect(val).to.eq('val2');
  });

  it('returns null when a key is not present', async () => {
    const col = await store.getCollection('foo');
    const val = await col.findByKey('bar');
    expect(val).to.be.null;
  });

  it('can delete a key', async () => {
    const col = await store.getCollection('foo');
    await col.setValue('bar', 'something');
    await col.dropByKey('bar');
    const val = await col.findByKey('bar');
    expect(val).to.be.null;
  });

  it('can drop all items', async () => {
    const col = await store.getCollection('foo');
    await col.setValue('bar', 'something');
    await col.setValue('baz', 'something');
    await col.emptyCollection();
    expect(await col.findByKey('bar')).to.be.null;
    expect(await col.findByKey('baz')).to.be.null;
  });
});
