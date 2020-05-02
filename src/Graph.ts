import { Subject } from './Subject';
import { subjTypeToPredArray, predIdToType, ont } from '../config/ontology';
import { Predicate } from './Predicate';
import * as n3 from 'n3';

const parser = new n3.Parser();

// a graph could be a page or a database
class Graph {
  protected _id: string = '';
  protected _subjectMap = new Map<string, Subject>();
  protected _predicateMap = new Map<string, Predicate>();

  constructor(id: string, turtle: string) {
    this._id = id;
    this.createAllPredicates();
    this._parseTurtle(turtle);
  }

  private createAllPredicates = () => {
    const predIdArray: string[] = subjTypeToPredArray;
    predIdArray.forEach(this.createPredicate);
  };

  public createPredicate = (predId: string): Predicate => {
    if (this._predicateMap.get(predId)) {
      throw new Error('duplicated predicate creation: ' + predId);
    }
    let predicate = new Predicate(predId, predIdToType[predId], this._id);
    this._predicateMap.set(predId, predicate);
    return predicate;
  };

  private _parseTurtle = (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === ont.rdf.type) {
        this.createSubject(quad.subject.id);
      }
    });

    // Should always create the root
    if (!this._subjectMap.get(this._id)) {
      this.createSubject(this._id);
    }

    quads.forEach(quad => {
      // TODO: should it throw on an unknown subject?
      let subject = this.getSubject(quad.subject.id);
      let predicate = this.getPredicate(quad.predicate.id);
      subject.fromQuad(predicate, quad);
    });
  };

  public getRoot = (): Subject => {
    return this.getSubject(this._id);
  };

  public getSubject = (id: string): Subject => {
    const subject = this._subjectMap.get(id);
    if (!subject) {
      throw new Error('Subject not found: ' + id);
    }
    return subject;
  };

  public getPredicate = (id: string): Predicate => {
    const predicate = this._predicateMap.get(id);
    if (!predicate) {
      throw new Error('Predicate not found: ' + id);
    }
    return predicate;
  };

  public createSubject = (subejectId: string): Subject => {
    if (this._subjectMap.get(subejectId)) {
      throw new Error('duplicated subject creation: ' + subejectId);
    }
    let subject = new Subject(subejectId, this._id);
    this._subjectMap.set(subejectId, subject);
    return subject;
  };

  public getSparqlForUpdate(): string {
    let sparql = '';
    for (let subject of this._subjectMap.values()) {
      sparql += subject.getSparqlForUpdate();
    }
    return sparql;
  }

  public commit() {
    for (let [id, subject] of this._subjectMap.entries()) {
      if (subject.isDeleted()) {
        this._subjectMap.delete(id);
      } else {
        subject.commit();
      }
    }
  }

  public undo() {
    for (let [id, subject] of this._subjectMap.entries()) {
      if (subject.isInserted()) {
        this._subjectMap.delete(id);
      } else {
        subject.undo();
      }
    }
  }
}

export { Graph };
