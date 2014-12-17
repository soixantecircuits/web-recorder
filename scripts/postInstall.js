var mkdirp = require('mkdirp');
mkdirp('./qrCode', function(err) { 
  if(err)
    console.log(err);
});

mkdirp('./img', function(err) { 
  if(err)
    console.log(err);
});