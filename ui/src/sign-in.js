import { reducer } from './miscellaneous';

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
        else throw new Error('服务器错误');
      })
      .then((data) => {
        console.info(data);
      })
      .catch((error) => {
        console.error(error.stack);
        window.alert(error.stack);
      });
  };

  React.useEffect(() => {
    fetch('/api/info')
      .then((response) => response.json())
      .then((data) => {
        setTitle(data.title);
      });
  });

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
                <strong>SIGN IN</strong>
              </div>

              <div className="card-body">
                <form className="row">
                  <div className="mb-3">
                    <label className="form-label">USERNAME</label>
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
                    <label className="form-label">PASSWORD</label>
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
                  SUBMIT
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

ReactDOM.render(<SignIn />, document.getElementById('root'));
