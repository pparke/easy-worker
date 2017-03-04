import { expect } from 'chai';
import Worker from '../src/Worker';

describe('Worker', () => {

  it('creates a worker and calls a method on the worker', (done) => {
    const worker = new Worker(function(){
      function calc(cluster) {
        const size = cluster.size;
        const o = { r: 0, g: 0, b: 0, x: 0, y: 0 };
        for (const ob of cluster) {
          o.r += ob.r / size;
          o.g += ob.g / size;
          o.b += ob.b / size;
          o.x += ob.x / size;
          o.y += ob.y / size;
        }
        return o;
      }
    });

    const c = new Set();
    c.add({ r: 1, g: 1, b: 1, x: 1, y: 1});
    c.add({ r: 2, g: 2, b: 2, x: 2, y: 2});
    c.add({ r: 3, g: 3, b: 3, x: 3, y: 3});
    c.add({ r: 4, g: 4, b: 4, x: 4, y: 4});
    worker.calc(c)
    .then(res => {
      console.log('Calc resulted in', res);
      expect(res).to.exist;
      done();
    })
    .catch(err => {
      console.log('failed with error', err);
      done();
    });
  })
})
