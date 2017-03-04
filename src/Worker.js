
const handler = {
  construct(target, args) {
    // get the function scope as a string
    let body = args[0].toString().trim();
    // remove the enclosing function expression
    body = body.replace(/^function\s*\(\.*\)\s*{\n?/, '');
    // remove the terminating curly bracket
    body = body.replace(/}$/, '');

    // build the switch statement that will act as the interface based
    // on the names of the functions in the body
    const methods = /function\s+(\w+)\s*\(.*\)/g.exec(body).slice(1);
    const cases = methods.map(fn => {
      return `\n\tcase '${fn}':\n\t\tresult = ${fn}(...args);\n\t\tbreak;\n`;
    }).join('');

    let source = target.toString().trim();
    // insert the switch statement
    source = source.replace(/switch\s*\(fn\)\s*{/, `$&${cases}`);
    // insert the body into the source after the opening function scope
    source = source.replace(/^function\s*\(\.*\)\s*{\n?/, `$&${body}`);

    const blob = new Blob([
        source.toString().replace(/^[^{]*{\s*([\d\D]*)\s*}[^}]*$/,'$1')
      ], { type: "text/javascript" });

    const url = window.URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.results = {};

    worker.onmessage = function(e) {
      const id = e.data[0];
      const status = e.data[1];
      const results = e.data.slice(2);
      if (status === 'success') {
        return this.results[id].resolve(...results);
      }
      this.results[id].reject(results);
    }

    methods.reduce((w, m) => {
      w[m] = function(...args) {
        const id = new Date().getTime();
        let resolve;
        let reject;
        w.results[id] = {
          promise: new Promise((res, rej) => { resolve = res; reject = rej; }),
          resolve,
          reject
        }
        w.postMessage([id, m, ...args]);
        return w.results[id].promise;
      }
    }, worker)

    return worker;
  },

}

const onmessage = function() {
  self.onmessage = function(e) {
    const id = e.data[0];
    const fn = e.data[1];
    const args = e.data.slice(2);
    let result = null;
    try {
      switch(fn) {
        default:
        throw new Error('Unknown Function');
        break;
      }
    }
    catch (err) {
      self.postMessage([id, 'error', `Failed to execute ${fn}`, err.name, err.message, err.lineNumber]);
      return;
    }

    self.postMessage([id, 'success', result]);
  }
}


export default new Proxy(onmessage, handler);
