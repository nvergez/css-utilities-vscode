import * as postcss from "postcss";
import * as postcssScss from "postcss-scss";

export interface CSSClass {
  name: string;
  properties: { [key: string]: string };
  selector: string;
  sourceFile: string;
  line: number;
  column: number;
  category?: string;
  description?: string;
}

export interface CSSParseResult {
  classes: CSSClass[];
  errors: string[];
}

export class CSSParser {
  async parseCSS(content: string, filePath: string): Promise<CSSParseResult> {
    const result: CSSParseResult = {
      classes: [],
      errors: [],
    };

    try {
      const isScss = filePath.endsWith(".scss") || filePath.endsWith(".sass");
      const processor = isScss ? postcssScss : postcss;

      const ast = processor.parse(content, {
        from: filePath,
        map: { inline: false },
      });

      this.extractClassesFromAST(ast, result, filePath);
    } catch (error) {
      result.errors.push(`Failed to parse ${filePath}: ${error}`);
    }

    return result;
  }

  private extractClassesFromAST(
    root: postcss.Root,
    result: CSSParseResult,
    filePath: string
  ): void {
    root.walkRules((rule) => {
      try {
        const selectors = this.parseSelector(rule.selector);

        selectors.forEach((selector) => {
          if (selector.startsWith(".") && this.isValidClassName(selector)) {
            const className = selector.substring(1);
            const properties: { [key: string]: string } = {};

            rule.walkDecls((decl) => {
              properties[decl.prop] = decl.value;
            });

            if (Object.keys(properties).length > 0) {
              const description = this.extractDescription(rule);
              const cssClass: CSSClass = {
                name: className,
                properties,
                selector: rule.selector,
                sourceFile: filePath,
                line: rule.source?.start?.line || 0,
                column: rule.source?.start?.column || 0,
                category: this.inferCategory(className, properties),
                ...(description && { description }),
              };

              result.classes.push(cssClass);
            }
          }
        });
      } catch (error) {
        result.errors.push(
          `Error processing rule "${rule.selector}": ${error}`
        );
      }
    });
  }

  private parseSelector(selector: string): string[] {
    return selector
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .flatMap((s) => {
        const classMatches = s.match(/\.[a-zA-Z_][\w-]*/g);
        return classMatches || [];
      });
  }

  private isValidClassName(className: string): boolean {
    return /^\.[a-zA-Z_][\w-]*$/.test(className);
  }

  private inferCategory(
    className: string,
    properties: { [key: string]: string }
  ): string {
    const name = className.toLowerCase();

    if (name.includes("flex") || name.includes("grid") || properties.display) {
      return "Layout";
    }

    if (
      name.includes("text") ||
      name.includes("font") ||
      properties.fontSize ||
      properties.fontFamily ||
      properties.color
    ) {
      return "Typography";
    }

    if (
      name.includes("bg") ||
      name.includes("background") ||
      properties.backgroundColor ||
      properties.background
    ) {
      return "Background";
    }

    if (
      name.includes("border") ||
      properties.border ||
      properties.borderRadius
    ) {
      return "Border";
    }

    if (
      name.includes("p-") ||
      name.includes("m-") ||
      name.includes("padding") ||
      name.includes("margin") ||
      properties.padding ||
      properties.margin
    ) {
      return "Spacing";
    }

    if (
      name.includes("w-") ||
      name.includes("h-") ||
      name.includes("width") ||
      name.includes("height") ||
      properties.width ||
      properties.height
    ) {
      return "Sizing";
    }

    if (
      name.includes("hidden") ||
      name.includes("visible") ||
      properties.visibility ||
      properties.opacity
    ) {
      return "Visibility";
    }

    return "Utilities";
  }

  private extractDescription(rule: postcss.Rule): string | undefined {
    const commentBefore = rule.prev();
    if (commentBefore && commentBefore.type === "comment") {
      const comment = commentBefore.text.trim();

      const descriptionMatch = comment.match(/@description\s+(.+)/);
      if (descriptionMatch) {
        return descriptionMatch[1].trim();
      }

      if (!comment.includes("@") && comment.length < 100) {
        return comment;
      }
    }

    return undefined;
  }
}
