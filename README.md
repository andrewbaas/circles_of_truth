# Circles of Truth

The goal of this project is to visualize proofs in a way which allows for both a
high-level understanding of the proof and an easy way to investigate the
foundations of the proof. 

## Foundational Concepts

I really want for there to be an underlying understanding of the unity of truth 
in this visualization. Thus, the circle represents truth. Each statement that is
equivalent to truth can replace a circle, thus showing how all truth is
equivalent. I will borrow the ideas of OpenGraphs for this project, since in
order to replace a circle with a new statement, there needs to be some operad 
which allows for the substitution.

## Format of Proofs

Proofs will be stored in an intermediary JSON format which is an array with the
following fields:

```json
"templates":[
{
"variables": ["x","y"],
"dependent": ["$x is an odd integer", "$y is an odd integer"],
"conclusion": ["$x + $y is an even integer"],
"name": ["Law of even numbers"],
"proof": proof_uid
}
],
"proofs":[
  {
  "statement":[
    {
    "template": 1,
    "variables": ["1","1"]
    }
  ],
  "priors":[
    {
    "template": template_uid,
    "satisfaction": post_uid
    },
  "posteriors":[
    {
    "template":template_uid
    }
  ]
  ],
  }
]
```

## Todo

Investigate the purpose of variables, and just how essential they are.
