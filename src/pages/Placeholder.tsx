import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ExternalLink } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  externalUrl?: string;
}

export default function Placeholder({ title, description, externalUrl }: PlaceholderProps) {
  useEffect(() => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  }, [externalUrl]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Construction className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground mb-4">{description}</p>
            {externalUrl && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4" />
                Open {title}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
