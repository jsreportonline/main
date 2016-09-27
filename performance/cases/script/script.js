function beforeRender(req, res, done) {
  require('request')({
    url:"http://jsonplaceholder.typicode.com/posts",
    json:true
  }, function(err, response, body){
    req.data = { posts: body };
    done();
  });
}