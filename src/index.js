import Promise from './promise';

const promise = new Promise((fulfill, reject) => {
  fulfill('done')
});

promise.then(function(val) {
  console.log(val); // 1
});
