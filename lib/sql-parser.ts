// A flexible SQL schema parser to extract table and column information

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  default?: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface ParsedSchema {
  tables: Table[];
  valid: boolean;
  errors: string[];
}

export function parseSQLSchema(sqlSchema: string): ParsedSchema {
  const result: ParsedSchema = {
    tables: [],
    valid: true,
    errors: [],
  };

  try {
    // Split the SQL into separate statements
    const statements = sqlSchema
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/--.*$/gm, "") // Remove single-line comments
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    // Process each statement
    for (const statement of statements) {
      let tableName = "";
      let columnsDefinition = "";

      // Try to match simplified syntax first: "tablename (columns)"
      const simplifiedMatch = statement.match(/^\s*(\w+)\s*\(([\s\S]*)\)/i);

      // If simplified syntax doesn't match, try traditional CREATE TABLE syntax
      const createTableMatch = statement.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*)\)/i
      );

      if (simplifiedMatch) {
        // Use the simplified syntax match
        tableName = simplifiedMatch[1];
        columnsDefinition = simplifiedMatch[2].trim();
      } else if (createTableMatch) {
        // Use the CREATE TABLE match
        tableName = createTableMatch[1];
        columnsDefinition = createTableMatch[2].trim();
      } else {
        continue;
      }

      const table: Table = {
        name: tableName,
        columns: [],
      };

      // Split column definitions
      const columnDefs = columnsDefinition
        .split(",")
        .map((def) => def.trim())
        .filter((def) => def.length > 0);

      // Track primary and foreign keys defined at table level
      const tableConstraints: string[] = [];

      for (const columnDef of columnDefs) {
        // Check if it's a constraint definition instead of a column
        if (
          /^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE)/i.test(columnDef)
        ) {
          tableConstraints.push(columnDef);
          continue;
        }

        // Extract column name, type, and constraints
        // the regex is flexible and can handle various formats
        const columnMatch = columnDef.match(
          /[`"']?(\w+)[`"']?\s+(\w+(?:\(\d+(?:,\d+)?\))?)(.*)/i
        );

        if (columnMatch) {
          const name = columnMatch[1];
          const type = columnMatch[2];
          const constraints = columnMatch[3] || "";

          const column: Column = {
            name,
            type,
            nullable: !/NOT\s+NULL/i.test(constraints),
            primaryKey: /PRIMARY\s+KEY/i.test(constraints),
            default: undefined,
          };

          // Check for default value
          const defaultMatch = constraints.match(
            /DEFAULT\s+(?:'([^']*)'|(\d+))/i
          );
          if (defaultMatch) {
            column.default = defaultMatch[1] || defaultMatch[2];
          }

          // Check for inline foreign key
          const foreignKeyMatch = constraints.match(
            /REFERENCES\s+[`"']?(\w+)[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i
          );
          if (foreignKeyMatch) {
            column.foreignKey = {
              table: foreignKeyMatch[1],
              column: foreignKeyMatch[2],
            };
          }

          table.columns.push(column);
        }
      }

      // Process table-level constraints
      for (const constraint of tableConstraints) {
        // Process primary key constraint
        const pkMatch = constraint.match(
          /PRIMARY\s+KEY\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i
        );
        if (pkMatch) {
          const pkColumn = table.columns.find((col) => col.name === pkMatch[1]);
          if (pkColumn) {
            pkColumn.primaryKey = true;
          }
        }

        // Process foreign key constraint
        const fkMatch = constraint.match(
          /FOREIGN\s+KEY\s*\(\s*[`"']?(\w+)[`"']?\s*\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\(\s*[`"']?(\w+)[`"']?\s*\)/i
        );
        if (fkMatch) {
          const fkColumn = table.columns.find((col) => col.name === fkMatch[1]);
          if (fkColumn) {
            fkColumn.foreignKey = {
              table: fkMatch[2],
              column: fkMatch[3],
            };
          }
        }
      }

      // Only add tables that have columns
      if (table.columns.length > 0) {
        result.tables.push(table);
      }
    }

    // Less strict validation - as long as we found some tables with columns, consider it valid
    if (result.tables.length === 0) {
      result.valid = false;
      result.errors.push("No valid table definitions found");
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Error parsing SQL schema: ${(error as Error).message}`);
  }

  return result;
}
