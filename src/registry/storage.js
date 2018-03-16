class Storage {
  constructor() {
      this.data = [];
  }

  save(serviceClient) {
      this.data.push(serviceClient);
  }

  get(type) {
      return this.data.filter((e) => e.type === type);
  }


  delete(service) {
      this.data.splice(this.data.indexOf(service), 1);
  }

  all() {
      return this.data;
  }
}

module.exports = Storage;