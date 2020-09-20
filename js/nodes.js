truths = get_mm_file("static/ql.mm")
cur_id = 0

class Hypothesis {
  constructor(statement){
    this.statement = statement
    this.id = cur_id++
  }
}

class Truth {
  constructor(name, hypotheses){
    this.name = name
    this.id = cur_id++
    let truth = truths[name]
    this.proof = truth.proof

    if(hypotheses == undefined){
      this.f_hyp = truth.f_hyp.map(x => new Hypothesis(x))
      this.e_hyp = truth.e_hyp.map(x => new Hypothesis(x))
      this.c_hyp = new Hypothesis(truth.stmnt)
    } else {
      // Use the f_hypothesis to get proper substitutions for variable names
      // then substitute into the c_hyp.
      var sub_map = {}
      var f_hyp = truth.f_hyp
      var c_hyp = truth.stmnt
      for(f_ind in f_hyp){
        let hyp_val = hypotheses[f_ind].statement.split(" ")
        sub_map[f_hyp[f_ind].split(" ")[1]] = hyp_val.slice(1,hyp_val.length).join(" ")
      }
      c_hyp = c_hyp.replace(/[^\s]+/g, m => m in sub_map ? sub_map[m] : m)
      this.f_hyp = hypotheses.slice(0,f_hyp.length)
      this.e_hyp = hypotheses.slice(f_hyp.length)
      this.c_hyp = new Hypothesis(c_hyp)
    }
  }

  // Expands a truth into its proper children. Returns the list of hypotheses
  // and truths generated
  prove(){
    if("proof" in this){
      let memory = this.f_hyp.concat(this.e_hyp)
      memory = memory.concat(this.proof.used)
      let new_truths = []
      let new_hyps = []
      let stack = []
      for(v_ind in this.proof.comp){
        let val = this.proof.comp[v_ind]
        let is_mem = val < 1;
        if(is_mem){
          val *= -1
        }
        val -= 1
        if(typeof(memory[val]) == "string"){
          let name = memory[val]
          let hyp_size = truths[name].f_hyp.length + truths[name].e_hyp.length
          let truth = new Truth(name, stack.slice(stack.length - hyp_size,stack.length))

          new_truths.push(truth)
          new_hyps.push(truth.c_hyp)

          stack = stack.slice(0, stack.length - hyp_size)
          stack.push(truth.c_hyp)
        } else {
          stack.push(memory[val])
        }
        if(is_mem){
          memory.push(stack[stack.length - 1])
        }
        //console.log("Stack state:")
        //console.log(stack)
        //for(s_ind in stack){
        //  console.log(stack[s_ind].statement)
        //}
        //console.log(memory)
      }
      //console.log("")
      //console.log(new_truths[new_truths.length - 1].c_hyp.statement)
      new_truths[new_truths.length - 1].c_hyp = this.c_hyp
      new_hyps.pop()
      //console.log(stack)
      return [new_truths, new_hyps]
    }else{
      console.log("Truth " + this.name + " is an axiom")
    }
  }
}

class Node{
  constructor(truth_arr, ind){
    this.index = ind
    this.source = truth_arr[ind]
    this.id = truth_arr[ind].id
    this.fixed = truth_arr[ind].fixed
    this.x = truth_arr[ind].x
    this.y = truth_arr[ind].y
    if("name" in truth_arr[ind]){
      let truth = truth_arr[ind]
      this.name = truth.name
      this.size = 1000
    } else {
      let hyp = truth_arr[ind]
      this.name = hyp.statement
      this.size = 10000
    }
  }
}

var w = 960,
    h = 500,
    node,
    link,
    global_truths,
    global_hyps;

var force = d3.layout.force()
    .on("tick", tick)
    .size([w, h]);

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

d3.json("readme.json", function(json) {
  root = json;
  update();
});

global_truths = [new Truth("mh2")]
global_hyps = global_truths[0].f_hyp.concat(global_truths[0].e_hyp)
global_hyps.push(global_truths[0].c_hyp)
for(h_ind in global_hyps){
  hyp = global_hyps[h_ind]
  hyp.fixed = true
  if(h_ind == global_hyps.length - 1){
    hyp.x = w
    hyp.y = h/2
  } else {
    hyp.x = 0
    hyp.y = h * (h_ind/(global_hyps.length + 1) + 1/(global_hyps.length+1))
    console.log(h)
    console.log(global_hyps.length)
    console.log(h_ind)
    console.log()
  }
}

function update() {
  var [nodes, links] = nodes_and_links(global_truths, global_hyps)

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .linkDistance(0)
      .linkStrength(function(l) {return l.strength})
      .charge(-100)
      .start();

  // Update the links…
  link = vis.selectAll("line.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links.
  link.enter().insert("svg:line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Exit any old links.
  link.exit().remove();

  // Update the nodes…
  node = vis.selectAll("circle.node")
      .data(nodes, function(d) { return d.id; })
      .style("fill", color);

  // Enter any new nodes.
  node.enter().append("svg:circle")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
      .style("fill", color)
      .on("click", click)
      .call(force.drag);

  // Exit any old nodes.
  node.exit().remove();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

// Toggle children on click.
function click(d) {
  var [n_truths, n_hyps] = d.source.prove()
  global_truths = global_truths.concat(n_truths).filter(x => x.id != d.source.id)
  global_hyps = global_hyps.concat(n_hyps)
  //console.log("New stuff")
  //console.log(n_truths)
  //console.log(n_hyps)
  //console.log("Combination")
  //console.log(global_truths)
  //console.log(global_hyps)
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}

function nodes_and_links(truth_array, hyp_array){
  let nodes = []
  let links = []

  //console.log("Received truths and hyps")
  //console.log(truth_array)
  //console.log(hyp_array)

  hyp_to_node = {}
  for(h_ind in hyp_array){
    let new_node =  new Node(hyp_array, h_ind)
    hyp_to_node[hyp_array[h_ind].id] = new_node
    nodes.push(new_node)
  }

  for(t_ind in truth_array){
    truth = truth_array[t_ind]
    new_node = new Node(truth_array, t_ind)
    nodes.push(new_node)
    num_hyp = truth.f_hyp.length + truth.e_hyp.length
    for(f_ind in truth.f_hyp){
      var link = {"source": new_node,
                  "target": hyp_to_node[truth.f_hyp[f_ind].id],
                  "strength":1/num_hyp}
      links.push(link)
    }
    for(e_ind in truth.e_hyp){
      var link = {"source": new_node,
                  "target": hyp_to_node[truth.e_hyp[e_ind].id],
                  "strength":1/num_hyp}
      links.push(link)
    }
    var link = {"source": new_node,
                "target": hyp_to_node[truth.c_hyp.id],
                "strength":1}
    links.push(link)
  }
  //console.log("Generated nodes and links")
  //console.log(nodes)
  //console.log(links)
  return [nodes, links]
}
