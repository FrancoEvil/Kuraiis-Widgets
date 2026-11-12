(function(root){
 const domains=['tiktokcdn.com','tiktokcdn-us.com','tiktokcdn-eu.com','tiktokcdn-eu.net','tiktokcdn-in.com','byteoversea.com','ibytedtos.com','byteimg.com','muscdn.com'];
 function url(value){if(typeof value!=='string'||value.length>4096)return '';try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))return '';return u.href;}catch{return '';}}
 function fromUser(user){const values=[user.avatarThumb,user.avatarMedium,user.avatarLarge];for(const value of [user.profilePictureUrl,...values.flatMap(v=>[...(Array.isArray(v?.urlList)?v.urlList:[]),...(Array.isArray(v?.url)?v.url:[])])]){const valid=url(value);if(valid)return valid;}return '';}
 const api={url,fromUser,csp:domains.map(d=>'https://'+d+' https://*.'+d).join(' ')};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.chatAvatar=api;
})(typeof globalThis!=='undefined'?globalThis:this);
