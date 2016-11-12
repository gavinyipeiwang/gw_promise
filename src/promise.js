class Promise {
  constructor(f) {
    this.states = {
      pending: 1,
      fulfilled: 2,
      rejected: 3
    }
    this.status = this.states.pending
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    const self = this

    function fulfill(value) {
      //if value is a promise, adopt its state
      if (value instanceof Promise) {
        return value.then(fulfill, reject)
      }

      //change status 
      if (self.status === self.states.pending) {
        self.status = self.states.fulfilled
        self.data = value
          //should call onFulfilled functions here
        self.onFulfilledCallbacks.forEach((f) => { f(value) })
      }
    }

    function reject(reason) {
      if (self.status === self.states.pending) {
        self.status = self.states.rejected
        self.data = reason
          //should call onRejected functions here
        self.onRejectedCallbacks.forEach((f) => { f(value) })
      }
    }

    try {
      //execute callback function and catch exceptions
      f(fulfill, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {
    //If onFulfilled or onRejected is not a function, it must be ignored.
    if (typeof onFulfilled !== 'function') {
      onFulfilled = (x) => x
    }

    if (typeof onRejected !== 'function') {
      onRejected = (x) => x
    }
    const self = this
    var promise2
    if (self.status === self.states.fulfilled) {
      return new Promise((fulfill, reject) => {
        try {
          //result is thenable which means it could also be promise
          var x = onFulfilled(self.data)
          self._resolvePromise(promise2, x, fulfill, reject)
        } catch (e) {
          return reject(e)
        }
      })
    }

    if (self.status === self.states.rejected) {
      return new Promise((fulfill, reject) => {
        try {
          var x = onFulfilled(self.data)
          self._resolvePromise(promise2, x, fulfill, reject)
        } catch (e) {
          reject(e)
        }
      })
    }

    if (self.status === self.states.pending) {
      return new Promise(function(fulfill, reject) {
        self.onFulfilledCallbacks.push(function(value) {
          try {
            var x = onResolved(value)
            self._resolvePromise(promise2, x, fulfill, reject)
          } catch (r) {
            reject(r)
          }
        })

        self.onRejectedCallbacks.push(function(reason) {
          try {
            var x = onRejected(reason)
            self._resolvePromise(promise2, x, fulfill, reject)
          } catch (r) {
            reject(r)
          }
        })
      })
    }
  }

  //2.3.The Promise Resolution Procedure
  _resolvePromise(promise, x, fulfill, reject) {
    //2.3.1 if promise and x refer to the same object, reject promise with a TypeError as the reason.
    if (promise === x) {
      return reject(new TypeError('Can not chain a promise with itself.'))
    }
    //2.3.2 if x is a promise, adopt its state
    if (x instanceof Promise) {
      if (x.status === this.states.pending) {
        //2.3.2.1 if x is pending, promise must remain pending until x is fulfilled or rejected.
        x.then(function(v) {
          this._resolvePromise(promise, v, fulfill, reject);
        }, reject);
      } else {
        x.then(fulfill, reject)
      }
      return
    }
    //2.3.3 if x is an object or function
    var then
    var thenCalledOrThrow = false
    if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
      try {
        then = x.then
        if (typeof then === 'function') {
          then.call(x, function rs(y) {
            if (thenCalledOrThrow) return
            thenCalledOrThrow = true
            return this._resolvePromise(promise, y, fulfill, reject)
          }, function rj(r) {
            if (thenCalledOrThrow) return
            thenCalledOrThrow = true
            return reject(r)
          })
        } else {
          return fulfill(x)
        }
      } catch (e) {
        if (thenCalledOrThrow) return
        thenCalledOrThrow = true
        return reject(e)
      }
    } else {
      return fulfill(x)
    }
  }
}

export default Promise
