window.Telegram = {
  WebApp: {
    initData:
      'query_id=test-query-id&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22fa%22%7D&auth_date=1777470227&hash=c23796680ebce1581547712ca24b8066ceb636f189cbd63a3bf9c6e1a78ea9c5',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Test',
        username: 'test_user',
        language_code: 'fa',
      },
    },
    ready() {},
    expand() {},
  },
};