import { Collection, MongoClient, Db } from 'mongodb';
import { KVStorage, KVStorageCollection } from 'wabe-ts';

type MongoRecord = {
  _id: string;
  value: string;
};

export class MongoKvStorageCollection implements KVStorageCollection {
  collection: Collection<MongoRecord>;

  constructor(collection: Collection<MongoRecord>) {
    this.collection = collection;
  }

  findByKey = async (key: string): Promise<null | string> => {
    const item = await this.collection.findOne({ _id: key });
    return item?.value || null;
  };

  dropByKey = async (key: string): Promise<void> => {
    await this.collection.deleteOne({ _id: key });
  };

  setValue = async (key: string, value: string): Promise<void> => {
    await this.collection.updateOne(
      { _id: key },
      { $set: { value } },
      { upsert: true },
    );
  };

  emptyCollection = async () => {
    await this.collection.deleteMany({});
  };

  getAllKeys = async (): Promise<string[]> =>
    (await this.collection.find({}).toArray()).map((row) => row._id);
}

export class MongoKvStorage implements KVStorage {
  prefix: string;
  mongoUrl: string;
  dbName: string;
  db: Db | undefined;
  client: MongoClient | undefined;

  constructor({
    prefix = '',
    mongoUrl,
    dbName,
  }: {
    prefix: string;
    mongoUrl: string;
    dbName: string;
  }) {
    this.prefix = prefix;
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
  }

  connect = async () => {
    this.client = new MongoClient(this.mongoUrl);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
  };

  disconnect = async () => {
    await this.client?.close();
  };

  isConnected = () => !!this.db;

  getCollection = async (name: string): Promise<KVStorageCollection> => {
    if (this.db == null) {
      await this.connect();
    }

    if (this.db == null) {
      throw new Error('Could not connect to database');
    }

    const collection = this.db.collection<MongoRecord>(
      this.prefix ? `${this.prefix}|${name}` : name,
    );
    return new MongoKvStorageCollection(collection);
  };
}
