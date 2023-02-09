class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // ? BUILD THE QUERY
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ? Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // ? Sorting
    if (this.queryString.sortBy) {
      const sortBy = this.queryString.sortBy.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // ? Field Limited
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // ! Exclude  __v, createdAt and updatedField fields from the response
      this.query = this.query.select('-__v -createdAt -updatedAt');
    }
    return this;
  }

  paginate() {
    // ? Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
