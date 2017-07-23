let app = require('express')()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let colors = require('colors')

app.get('/', (req, res) => {
  res.send('<h1>It works!</h1>')
});

io.on('connection', (socket) => {
  console.log('A client connected'.green)

  let timer = setInterval(() => {
    socket.emit('bullet', {
      Callback: 50 + 50 * Math.random(),
      Backend: 50 * Math.random(),
      Frontend: 100 + 100 * Math.random()
    })
  }, 500 + 1500 * Math.random())

  socket.on('disconnect', function(){
    console.log('A client disconnected'.red)

    clearInterval(timer)
  });
});

http.listen(3000, () => {
  console.log('Listening on *:3000')
});
