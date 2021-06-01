import { reducer } from './miscellaneous.mjs';
import { Footer } from './component.mjs';

const initial_user = {
  username: '',
  password: '',
};

function SignIn() {
  const [title, setTitle] = React.useState('');
  const [user, dispatch] = React.useReducer(reducer, initial_user);

  const handleSignIn = () => {
    if (!user.username || !user.password) {
      window.alert('请完整填写所需信息');
      return;
    }

    fetch('/api/setting/user/sign-in', {
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
        else if (response.status === 401) throw new Error('用户名或密码错误');
        else if (response.status === 409) throw new Error('用户账号异常');
        else throw new Error('服务器错误');
      })
      .then((data) => {
        console.info(data);
        // 附加jwt重定向到原地址
        let to = new URLSearchParams(window.location.search).get('from');
        to += `?token=${data.jwt}`;
        console.log(to);
        window.location = to;
      })
      .catch((error) => window.alert(error));
  };

  React.useEffect(() => {
    console.log(window.location.search);
  }, []);

  React.useEffect(() => {
    fetch('/api/info')
      .then((response) => response.json())
      .then((data) => {
        setTitle(data.title);
      });
  }, []);

  return (
    <>
      <div className="d-flex flex-column h-100 w-100 min">
        <header>
          <h1 className="mx-2">{title}</h1>
          <hr />
        </header>

        <main className="flex-grow-1">
          <div className="container-lg d-flex h-100 align-items-center justify-content-center">
            <div className="card shadow col-6 col-lg-4">
              <div className="card-header lead">
                <strong>用户登录</strong>
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
                </form>
              </div>

              <div className="card-footer d-grid gap-2">
                <button className="btn btn-primary" onClick={handleSignIn}>
                  提交
                </button>
                <a
                  href="sign-up.html"
                  className="text-center text-decoration-none"
                >
                  注册新用户
                </a>
                <button
                  type="button"
                  className="btn btn-link text-center text-decoration-none"
                  onClick={() => window.history.back()}
                >
                  返回
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

ReactDOM.render(<SignIn />, document.getElementById('root'));
