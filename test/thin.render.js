thin = {} || thin;

thin.config = {
  render: "html"
};

/**
 * TODO:
 * XML converter
 * CSS converter
 * Map tagNames
 */

(function(o){

  o.render = {};
  //Renders converters
  o.render.format = {};
  o.render.format.xml = function(tag,attrs,contents) {
    //XML Dom 
  }
  o.render.format.html = function(tag,attrs,contents) {
    var attr_txt = "";
    for (var i = attrs.length - 1; i >= 0; i--) {
      attr_txt += ' '+attrs[i][0]+'="'+attrs[i][1]+'"';
    };
    return ("<"+tag+attr_txt+">"+contents.join("")+"</"+tag+">");
  }
  o.render.format.dom = function(tag,attrs,contents) {
    var dom = document.createElement(tag);
    contents.reverse();
    for (var i = attrs.length - 1; i >= 0; i--) {
      if (attrs[i][0] == "class") attrs[i][0] = "className";
      dom[attrs[i][0]] = attrs[i][1];
    };
    for (var i = contents.length - 1; i >= 0; i--) {
      if (typeof contents[i] == "string") {
        dom.innerHTML = contents[i];
      } else {
        dom.appendChild(contents[i])
      };
    };
    return dom;
  }
  o.render.format.array = function(tag,attrs,contents) {
    return [tag,attrs,contents];
  }



  o.render.create_node = function(tag,attrs,contents,data){
    var format = data.__format || o.config.render;
    return o.render.format[format](tag,attrs,contents);
  }

  o.render.parse_attr = function (attr,value) {
    return [attr,value];
  }

  o.render.create_attrs = function(node) {
    var parsed = [];
    if (typeof node == "object" && !(node instanceof Array)) {
      for (attr in node){
        if (attr != "content") parsed.push(o.render.parse_attr(attr,node[attr]))
      }
    };
    return parsed;
  }

  o.render.parse_content = function(content,data) {
    var parsed = [];
    if (content instanceof Array) {
      for (var i = content.length - 1; i >= 0; i--) {
        parsed.unshift(o.render.parse_node(content[i],data))
      };
    } else {
      if (typeof content == "string") {
        if (!content) content = "";
        parsed.unshift(o.render.tmpl(content,data));
      } else {
        if (!content.content) content.content = "";
        if (typeof content.content == "string" ) {
          parsed.unshift(o.render.tmpl(content.content,data));
        } else {
          for (var i = content.content.length - 1; i >= 0; i--) {
            parsed.unshift(o.render.parse_node(content.content[i],data));
          };
        };
      };
    };
    return parsed;
  };

  o.render.parse_node = function(node,data){ //map tag
    for (tag in node) break;
    return o.render.create_node(
       tag
      ,o.render.create_attrs(node[tag])
      ,o.render.parse_content(node[tag],data)
      ,data
    );
  };

  o.render.tmpl = function(str, data){
    var fn = new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +
      "with(obj){p.push('" +
        str
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
          .split("\r").join("\\'")
          + "');}return p.join('');");
    return data ? fn( data ) : fn;
  };

  o.render.the = function(temp, data) {
    if (!data) data = {};
    return o.render.parse_node(temp,data);
  };

})(thin);
