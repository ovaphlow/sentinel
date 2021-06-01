import { reducer } from './miscellaneous.mjs';
import { Footer } from './component.mjs';

const initial_user = {
  username: '',
  password: '',
  password2: '',
};

function SignUp() {
  const [title, setTitle] = React.useState('');
  const [user, dispatch] = React.useReducer(reducer, initial_user);

  const handleSignUp = () => {
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
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        password: md5(user.password),
      }),
    })
      .then((response) => {
        if (response.status === 200) return response.json();
        else if (response.status === 401) throw new Error('用户数据异常');
        else if (response.status === 409) throw new Error('用户已存在');
        else throw new Error('操作失败');
      })
      .then((data) => {
        console.info(data);
        // 将 data.jwt 返回原网站地址
      })
      .catch((err) => window.alert(err));
  };

  const handleBackward = () => {
    // urlparams
  };

  React.useEffect(() => {
    fetch('/api/info')
      .then((response) => response.json())
      .then((data) => {
        setTitle(data.title);
      });
  }, []);

  return (
    <>
      <div className="d-flex flex-column h-100 w-100">
        <header>
          <h1 className="mx-2">{title}</h1>
          <hr />
        </header>

        <main className="flex-grow-1">
          <div className="container-lg d-flex h-100 align-items-center justify-content-center">
            <div className="card shadow col-6 col-lg-4">
              <div className="card-header lead">
                <strong>注册新用户</strong>
              </div>

              <div className="card-body">
                <form className="row">
                  <div className="mb-3">
                    <label className="form-label">用户名</label>
                    <input
                      type="text"
                      value={user.username}
                      className="form-control"
                      onChange={(event) =>
                        dispatch({
                          type: 'set',
                          payload: {
                            key: 'username',
                            value: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">密码</label>
                    <input
                      type="password"
                      value={user.password}
                      className="form-control"
                      onChange={(event) =>
                        dispatch({
                          type: 'set',
                          payload: {
                            key: 'password',
                            value: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">重复密码</label>
                    <input
                      type="password"
                      value={user.password2}
                      className="form-control"
                      onChange={(event) =>
                        dispatch({
                          type: 'set',
                          payload: {
                            key: 'password2',
                            value: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </form>
              </div>

              <div className="card-footer d-grid gap-2">
                <button className="btn btn-primary" onClick={handleSignUp}>
                  提交
                </button>
                <a
                  href="sign-in.html"
                  className="text-center text-decoration-none mb-2"
                >
                  用户登录
                </a>
                <a
                  href="#"
                  className="text-center text-decoration-none"
                  onClick={handleBackward}
                >
                  返回
                </a>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

ReactDOM.render(<SignUp />, document.getElementById('root'));
