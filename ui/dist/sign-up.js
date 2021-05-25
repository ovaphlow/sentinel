function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]);

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function reducer(state, action) {
  if (action.type === 'set') {
    return _objectSpread2(_objectSpread2({}, state), {}, _defineProperty({}, action.payload.key, action.payload.value));
  } else {
    return state;
  }
}

var initial_user = {
  username: '',
  password: '',
  password2: ''
};

function SignUp() {
  var _React$useState = React.useState(''),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      title = _React$useState2[0],
      setTitle = _React$useState2[1];

  var _React$useReducer = React.useReducer(reducer, initial_user),
      _React$useReducer2 = _slicedToArray(_React$useReducer, 2),
      user = _React$useReducer2[0],
      dispatch = _React$useReducer2[1];

  var handleSignUp = function handleSignUp() {
    if (!user.username || !user.password) {
      window.alert('请完整填写所需信息');
      return;
    }

    if (user.password !== user.password2) {
      window.alert('两次输入的密码不一致');
      return;
    }

    fetch('/api/setting/user', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        username: user.username,
        password: md5(user.password)
      })
    }).then(function (response) {
      if (response.status === 200) return response.json();else throw new Error('服务器错误');
    }).then(function (data) {
      console.info(data);
    })["catch"](function (error) {
      console.error(error.stack);
      window.alert(error.stack);
    });
  };

  React.useEffect(function () {
    fetch('/api/info').then(function (response) {
      return response.json();
    }).then(function (data) {
      setTitle(data.title);
    });
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-column h-100 w-100"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h1", {
    className: "mx-2"
  }, title), /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("main", {
    className: "flex-grow-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container-lg d-flex h-100 align-items-center justify-content-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow col-6 col-lg-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header lead"
  }, /*#__PURE__*/React.createElement("strong", null, "SIGN UP")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("form", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "USERNAME"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: user.username,
    className: "form-control",
    onChange: function onChange(event) {
      return dispatch({
        type: 'set',
        payload: {
          key: 'username',
          value: event.target.value
        }
      });
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "PASSWORD"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: user.password,
    className: "form-control",
    onChange: function onChange(event) {
      return dispatch({
        type: 'set',
        payload: {
          key: 'password',
          value: event.target.value
        }
      });
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "PASSWORD 2"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: user.password2,
    className: "form-control",
    onChange: function onChange(event) {
      return dispatch({
        type: 'set',
        payload: {
          key: 'password2',
          value: event.target.value
        }
      });
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "card-footer d-grid gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: handleSignUp
  }, "SUBMIT")))))));
}

ReactDOM.render( /*#__PURE__*/React.createElement(SignUp, null), document.getElementById('root'));
