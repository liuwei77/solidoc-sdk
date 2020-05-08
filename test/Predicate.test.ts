import { Predicate } from '../src/Predicate';
import { Object } from '../src/Subject';
import { ont } from '../config/ontology';
import { config } from '../config/test';
import * as assert from 'power-assert';

// import * as n3 from 'n3';
// const parser = new n3.Parser();

const node = config.text[8];
const page = config.page;

// const quads: any[] = parser.parse(turtle.text[8]);

describe('Type: a NamedNode Predicate', () => {
  let type: Predicate;

  const initial: Object = {
    value: node.type,
    type: ont.xsd.anyURI,
  };

  const updated: Object = {
    value: ont.sdoc.paragraph,
    type: ont.xsd.anyURI,
  };

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> <${ont.sdoc.paragraph}>} };\n`;

  beforeEach(() => {
    type = new Predicate(ont.rdf.type, page.id);
  });

  // it('parses quad as a named node', () => {
  //   assert.strictEqual(type.fromQuad(quads[0]), node.type);
  // });

  it('generates null sparql if no changes applied', () => {
    const sparql: string = type.getSparql(node.id, initial, initial);
    assert.strictEqual(sparql, '');
  });

  it('generate sparql for updated Predicate', () => {
    const sparql: string = type.getSparql(node.id, updated, initial);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generate sparql for deleted Predicate', () => {
    const sparql: string = type.getSparql(node.id, type.default, initial);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generate sparql for a just-added Predicate', () => {
    const sparql: string = type.getSparql(node.id, updated, type.default);
    assert.strictEqual(sparql, insertClause);
  });
});

describe('Text Predicate', () => {
  let text: Predicate;

  const initial: Object = {
    value: node.text,
    type: ont.xsd.string,
  };

  const updated: Object = {
    value: 'Hello world!',
    type: ont.xsd.string,
  };

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> "Hello world!"} };\n`;

  beforeEach(() => {
    text = new Predicate(ont.sdoc.text, page.id);
  });

  // it('parses quad as text', () => {
  //   assert.strictEqual(text.fromQuad(quads[1]), node.text);
  // });

  it('generates null sparql', async () => {
    const sparql: string = text.getSparql(node.id, initial, initial);
    assert.strictEqual(sparql, '');
  });

  it('generates sparql for update', async () => {
    const sparql: string = text.getSparql(node.id, updated, initial);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generates sparql for deletion only', async () => {
    const sparql: string = text.getSparql(node.id, text.default, initial);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generates sparql for insertion only', async () => {
    const sparql: string = text.getSparql(node.id, updated, text.default);
    assert.strictEqual(sparql, insertClause);
  });
});

// describe('Boolean Predicate', () => {
//   let text: Predicate;

//   const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> ?o } };\n`;
//   const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> "Hello world!"} };\n`;

//   beforeEach(() => {
//     text = new Predicate(ont.sdoc.text, page.id);
//   });

//   it('parses quad as text', () => {
//     assert.strictEqual(text.fromQuad(quads[1]), node.text);
//   });

//   it('generates null sparql', async () => {
//     const sparql: string = text.getSparql(node.id, node.text, node.text);
//     assert.strictEqual(sparql, '');
//   });

//   it('generates sparql for update', async () => {
//     const sparql: string = text.getSparql(node.id, 'Hello world!', node.text);
//     assert.strictEqual(sparql, deleteClause + insertClause);
//   });

//   it('generates sparql for deletion only', async () => {
//     const sparql: string = text.getSparql(node.id, '', node.text);
//     assert.strictEqual(sparql, deleteClause);
//   });

//   it('generates sparql for insertion only', async () => {
//     const sparql: string = text.getSparql(node.id, 'Hello world!', '');
//     assert.strictEqual(sparql, insertClause);
//   });
// });
