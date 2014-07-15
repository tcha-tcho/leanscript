thin = {} || thin;

thin.config = {
   render: "html"
  ,keepScripts: true
};

(function(o){

  o.render = {};
  //Renders converters
  o.render.format = {};
  o.render.format.html = function(tag,attrs,contents,xml) {
    if (tag == "!") return ("<"+tag+"-- "+contents.join("")+" -->")
    var singles = ["br", "col", "command", "embed", "hr", "img", "input", "link", "meta", "param", "source"];
    var end = "</"+tag+">";
    if (!xml && singles.indexOf(tag) != -1) end = "";
    return ("<"+tag+attrs.join("")+">"+contents.join("")+end);
  }
  o.render.format.html.attr = function(attr,value,tag){
    return (' '+attr+'="'+value+'"');
  }
  o.render.format.dom = function(tag,attrs,contents,xml) {
    if (tag == "!") {
      // return document.createElement('Comment').data = contents.join("");
      return "";
    }
    var dom = document.createElement(tag);
    contents.reverse();
    for (var i = attrs.length - 1; i >= 0; i--) {
      dom.setAttribute( attrs[i][0], attrs[i][1] );
    };
    for (var i = contents.length - 1; i >= 0; i--) {
      if (typeof contents[i] == "string") {
        dom["innerHTML"] = contents[i]; // dom[(xml?"nodeValue":"innerHTML")] = contents[i]
      } else {
        dom.appendChild(contents[i])
      };
    };
    return dom;
  }
  o.render.format.xml = function(tag,attrs,contents) {
    return o.render.format.html(tag,attrs,contents,true); //?-> <?xml version="1.0" encoding="UTF-8"?>
  }
  o.render.format.xml.attr = function(attr,value,tag){
    return o.render.format.html.attr(attr,value,tag);
  }
  o.render.format.dom_xml = function(tag,attrs,contents) {
    return o.render.format.dom(tag,attrs,contents,true);
  }
  o.render.format.array = function(tag,attrs,contents) {
    return [tag,attrs,contents];
  }
  o.render.format.bbcode = function(tag,attrs,contents) {
    if (tag == "!") return "";
    var singles = ["*","br"];
    var end = "[/"+tag+"] ";
    if (singles.indexOf(tag) != -1) end = " ";
    if (tag == "img") {
      contents = [attrs[0].replace("=","")];
      attrs = [];
    };
    return (" ["+tag+attrs.join("")+"]"+contents.join("")+end);
  }
  o.render.format.bbcode.tag = function(tag){
    return ({
       "div":"p"
      ,"a":"url"
      ,"blockquote":"quote"
      ,"pre":"code"
      ,"ul":"list"
      ,"ol":"list"
      ,"li":"*"
      ,"font":"style"
      ,"span":"style"
    })[tag] || tag;
  }
  o.render.format.bbcode.attr = function(attr,value,tag){
    // TODO:
    // [style size="15px"]Large Text[/style]
    // [style color="#FF0000"]Large Text[/style]
    var ok = (({
       "url":{href:true}
      ,"img":{src:true}
      ,"quote":{author:true}
      ,"style":{style:true}
    })[tag] || {})[attr];
    return ok?("="+value):"";
  }




  o.render.create_attrs = function(node,tag,data) {
    var parsed = [];
    if (typeof node == "object" && !(node instanceof Array)) {
      for (attr in node) {
        if (attr != "content") {
          var ar = [attr,node[attr],tag];
          if (data.__converter.attr) ar = data.__converter.attr(ar[0],ar[1],ar[2]);
          parsed.push(ar);
        };
      }
    };
    return parsed;
  }

  o.render.create_content = function(content,data) {
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
    node = node[tag];
    if(data.__converter.tag) tag = data.__converter.tag(tag);

    return data.__converter( tag
      ,o.render.create_attrs(node,tag,data)
      ,o.render.create_content(node,data)
    )
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
    if (!data.__format) data.__format = o.config.render;
    if (!data.__converter) data.__converter = o.render.format[data.__format];

    return o.render.parse_node(temp,data);
  };






/**
 * TODO:
 * Variables
 * Nesting
 * Partials
 * Import
 * Mixins
 * Inheritance
 * Operators
 * 
 */

  
  o.render.style = function() {
    
  }








  o.render.jml = {};

  o.render.jml.from_xml = function(xml) {
    var jml = {};
    var node = xml.nodeName.toLowerCase();
    jml[node] = [];

    if (xml.nodeType == 1) { // element
      var attrs = xml.attributes;
      if (attrs.length > 0) {
        jml[node] = {};
        for (var j = 0; j < attrs.length; j++) {
          var attribute = attrs.item(j);
          jml[node][attribute.nodeName] = attribute.nodeValue;
        }
      }
    }
    // do children
    if (xml.hasChildNodes()) {
      for(var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var is_arr = (jml[node] instanceof Array);
        if( item.nodeType == 1 ) {
          if (is_arr) {
            jml[node].push(o.render.jml.from_xml(item));
          } else {
            if(!jml[node].content) jml[node].content = [];
            jml[node].content.push(o.render.jml.from_xml(item));
          };
        } else if (item.nodeType == 8) {
          jml[node].push( {"!":item.data} ); // comments
        } else if (item.nodeType == 3) {
          if (!/^\s+|\s+$/g.test(item.nodeValue)) { //TODO: empty nodes problem
            if ( is_arr ) {
              jml[node] = item.nodeValue;
            } else {
              jml[node].content = item.nodeValue;
            };
          };
        }
      }
    } else {
      if (jml[node].length == 0) jml[node] = "";
    }
    return jml;
  }

  o.render.jml.html = function(doc) {
    if (typeof doc == "string") {
      var el = document.createElement( 'div' );
      el.innerHTML = doc;
      doc = el.firstChild;
    };
    return o.render.jml.from_xml(doc);
  }

  o.render.jml.from = function(type,data) {
    return o.render.jml[type](data);
  }





})(thin);
