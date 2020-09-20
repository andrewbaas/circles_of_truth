function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
      result = xmlhttp.responseText;
  }
  return result;
}

function get_mm_file(file) {
  var data = loadFile(file)
  data = remove_comments(data)
  frames = get_frames(data)
  data = remove_frames(data)
  var [f_hyp, hyp_dat] = get_f_hyp(data)
  thm_dat = get_theorem_data(data, f_hyp)
  frm_dat = get_frame_data(frames, f_hyp)
  
  return Object.assign({}, thm_dat, frm_dat)
}

function remove_comments(str) {
  regexp = /\$\((?:[^\$]|\$[^\)])*\$\)/gm
  res = str.replace(regexp, "")
  return res
}

/* get_f_hyp
 *
 * Get and process all floating hypotheses
 */
function get_f_hyp(str) {
  v_to_name = {}
  name_to_v = {}
  regexp = /([^\s]+)\s+\$f\s+([^\s]+\s+([^\s]+))\s+\$\./gm;
  array = [...str.matchAll(regexp)];
  
  for(var ind in array) {
    def = array[ind]
    v_to_name[def[3]] = [def[2],ind]
    name_to_v[def[1]] = def[2]
  }
  return [v_to_name, name_to_v]
}

function get_frames(str){
  regexp = /\$\{\s+((?:[^\$]|\$[^\}])*)\s+\$\}/gm;
  array = [...str.matchAll(regexp)];
  return array.map(x => x[1])
}

function remove_frames(str){
  regexp = /\$\{(?:[^\$]|\$[^\}])*\$\}/gm;
  res = str.replace(regexp, "")
  return res
}

function get_theorem_data(str, f_hyp){
  proofexp = /([^\s]+) \$p\s+((?:[^\$]|\$[^=])*)\s+\$=\s+\(\s+([^\)]*)\s+\)\s+((?:[^\$]|\$[^\.])*)\s+\$\./gm; 
  axiomexp = /([^\s]+)\s+\$a\s+((?:[^\$]|\$[^\.])*)\s+\$\./gm;
  
  p_array = [...str.matchAll(proofexp)];
  a_array = [...str.matchAll(axiomexp)];
  stmnts = {};
  
  // Process all axioms
  for( ind in a_array ){
    axiom = a_array[ind]
    name = axiom[1]
    stmnt = axiom[2].replace(/\s+/g," ")
    hypotheses = get_f_hypotheses(stmnt, f_hyp)
    stmnts[name] = {"f_hyp":hypotheses,
                    "e_hyp":[],
                    "stmnt":stmnt}
  }

  // Process all proof
  for( ind in p_array ){
    proof = p_array[ind]
    name = proof[1]
    stmnt = proof[2].replace(/\s+/g," ")
    used = proof[3].split(/\s/g).filter(x => x)
    compress = proof[4]
    tmp_f_hyp = get_f_hypotheses(stmnt, f_hyp)
    stmnts[name] = {"f_hyp":tmp_f_hyp,
                    "e_hyp":[],
                    "stmnt":stmnt,
                    "proof":{"used":used,
                             "comp":compression_to_int(compress)
                            }
                    }
  }
  return stmnts
}

function get_frame_data(frames, f_hyp){
  proofexp = /([^\s]+)\s+\$p\s+((?:[^\$]|\$[^=])*)\s+\$=\s+\(\s+([^\)]*)\s+\)\s+((?:[^\$]|\$[^\.])*)\s+\$\./gm; 
  axiomexp = /([^\s]+)\s+\$a\s+((?:[^\$]|\$[^\.])*)\s+\$\./gm;
  reqexp = /([^\s]+)\s+\$[e|f]\s+((?:[^\$]|\$[^\.])*)\s+\$\./gm

  stmnts = {}
  for( f_ind in frames ){
    frame = frames[f_ind]
    p_array = [...frame.matchAll(proofexp)];
    a_array = [...frame.matchAll(axiomexp)];
    r_array = [...frame.matchAll(reqexp)];
   
    req_hyp = r_array.map(x => x[2])
    for(a_ind in a_array){
      axiom = a_array[a_ind]
      name = axiom[1]
      stmnt = axiom[2].replace(/\s+/g," ")
      hypotheses = get_f_hypotheses(req_hyp.concat([stmnt]), f_hyp)
      stmnts[name] = {"f_hyp":hypotheses,
                      "e_hyp":req_hyp,
                      "stmnt":stmnt}
    }
    for(p_ind in p_array){
      proof = p_array[p_ind]
      name = proof[1]
      stmnt = proof[2].replace(/\s+/g," ")
      used = proof[3].split(/\s/g).filter(x => x)
      compress = proof[4]
      tmp_f_hyp = get_f_hypotheses(req_hyp.concat([stmnt]), f_hyp)
      stmnts[name] = {"f_hyp":tmp_f_hyp,
                      "e_hyp":req_hyp,
                      "stmnt":stmnt,
                      "proof":{"used":used,
                               "comp":compression_to_int(compress)
                              }
                      }
    }
  }
  return stmnts
}

function get_f_hypotheses(stmnts, f_hyp){
  if(typeof stmnts == "string"){
    stmnts = [stmnts]
  }
  e_hyps = new Set()
  // Iterate through each statement for variables
  for(s_ind in stmnts){
    stmnt = stmnts[s_ind]
    vars = stmnt.split(" ")
    for(v_ind in vars){
      cur_var = vars[v_ind];
      if( cur_var in f_hyp ){
        e_hyps.add(f_hyp[cur_var])
      }
    }
  }
  // Sort hypothesis by order
  e_hypa = Array.from(e_hyps)
  e_hypa.sort(function(a,b){return a[1] - b[1]})
  return e_hypa.map(x => x[0])
}

function compression_to_int(compress){
  int_vals = []
  number_exp = /[U-Y]*[A-T][Z]{0,1}/g
  compress = compress.replace(/\s/g,"")
  comp_nums = [...compress.matchAll(number_exp)];
  return comp_nums.map(x => c_to_i(x[0]))
}

function c_to_i(compressed){
  U_val = "U".charCodeAt()
  A_val = "A".charCodeAt()
  val = 0
  mem_factor = 1
  if(compressed[compressed.length - 1] == "Z"){
    mem_factor = -1
    compressed = compressed.substring(0, compressed.length - 1)
  }
  for(c_ind in compressed){
    c = compressed.charCodeAt(c_ind)
    if( c < U_val ){
      val *= 20
      val += c - A_val + 1
    } else {
      val *= 5
      val += c - U_val + 1
    }
  }
  return val * mem_factor
}
