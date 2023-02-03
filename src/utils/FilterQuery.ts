// filters=[["nama","=","Ilham Ramdhani"]]
// fields=["name","username","email"]

import { IStateFilter } from "../Interfaces";

interface IFilterQuery {
  status: boolean;
  data: any[];
}

class FilterQuery {
  public getFilter(filters: any, stateFilter: IStateFilter[]): IFilterQuery {
    // Mengeset semua filter
    let valid: boolean = true;
    let allFilter: any[] = [];
    let unicFilter: any[] = [];
    if (filters.length > 0) {
      for (const filter of filters) {
        let validFilter = stateFilter.filter((item) => {
          // Cek apakah operator valid
          let validOperator: any = item.operator.filter(
            (i: any) => i == filter[1]
          );
          // End
          return item.name === filter[0] && validOperator.length !== 0;
        });
        // Cek validasi filter tersedia
        if (validFilter.length === 0) {
          valid = false;
        }
        // End
        let field: any = {};
        let child: any = {};

        switch (filter[1]) {
          case "like":
            child.$regex = filter[2];
            child.$options = "i";
            break;
          case "notlike":
            child.$not = { $regex: filter[2], $options: "i" };
            break;
          case "=":
            child.$eq = `${filter[2]}`;
            break;
          case "!=":
            child.$ne = `${filter[2]}`;
            break;
          case ">":
            child.$gt =
              typeof filter[2] == "number" ? filter[2] : new Date(filter[2]);
            break;
          case ">=":
            child.$gte =
              typeof filter[2] == "number" ? filter[2] : new Date(filter[2]);
            break;
          case "<":
            child.$lt =
              typeof filter[2] == "number" ? filter[2] : new Date(filter[2]);
            break;
          case "<=":
            child.$lte =
              typeof filter[2] == "number" ? filter[2] : new Date(filter[2]);
            break;
        }

        if (Object.keys(child).length) {
          field[filter[0]] = child;
        }
        let isDuplicate = allFilter.filter(
          (item) => Object.keys(item)[0] == filter[0]
        );
        allFilter.push(field);
        if (isDuplicate.length === 0) {
          unicFilter.push(filter[0]);
        }
      }
    }

    let finalFilter: any = [];
    for (const item of unicFilter) {
      let ismerge = allFilter.filter((all) => Object.keys(all)[0] === item);
      let simpan;
      if (ismerge.length > 1) {
        simpan = { $or: ismerge };
      } else {
        simpan = ismerge[0];
      }
      finalFilter.push(simpan);
    }

    let filterData: any =
      Object.keys(finalFilter).length > 0
        ? {
            $and: finalFilter,
          }
        : {};

    if (valid) {
      return {
        status: true,
        data: filterData,
      };
    } else {
      return { status: false, data: [] };
    }
  }

  public getField = (fields: any) => {
    let setField: any = {};
    for (const field of fields) {
      if (field != "password") {
        setField[field] = 1;
      }
    }
    return setField;
  };
}

export default new FilterQuery();
