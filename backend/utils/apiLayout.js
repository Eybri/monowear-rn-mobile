class APILayout {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  categoryFilter() {
    if (this.queryStr.category) {
      this.query = this.query.find({ category: this.queryStr.category });
    }
    return this;
  }

  priceFilter() {
    if (this.queryStr.price) {
      const priceQuery = {};
      
      if (this.queryStr.price.$gte) {
        priceQuery.$gte = Number(this.queryStr.price.$gte);
      }
      
      if (this.queryStr.price.$lte) {
        priceQuery.$lte = Number(this.queryStr.price.$lte);
      }
      
      if (Object.keys(priceQuery).length > 0) {
        this.query = this.query.find({ price: priceQuery });
      }
    }
    return this;
  }

  ratingFilter() {
    if (this.queryStr.ratings) {
      this.query = this.query.find({ ratings: { $gte: this.queryStr.ratings } });
    }
    return this;
  }

  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

module.exports = APILayout;