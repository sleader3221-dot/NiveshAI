import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/stockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, IndianRupee, Target, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['financial-profile', user?.email],
    queryFn: () => db.entities.FinancialProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (profile && !form) {
      setForm({
        monthly_income: profile.monthly_income || '',
        monthly_expenses: profile.monthly_expenses || '',
        total_savings: profile.total_savings || '',
        investment_goal: profile.investment_goal || 'medium_term',
        risk_appetite: profile.risk_appetite || 'moderate',
        investment_experience: profile.investment_experience || 'beginner',
        age: profile.age || '',
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: (data) => db.entities.FinancialProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile', user?.email] });
      toast.success('Profile updated!');
    },
  });

  const handleSave = () => {
    const investable = Math.max(0, (Number(form.monthly_income) - Number(form.monthly_expenses)) * 0.5);
    const savingsAlloc = Number(form.total_savings) * (form.risk_appetite === 'conservative' ? 0.1 : form.risk_appetite === 'moderate' ? 0.2 : 0.3);
    updateMutation.mutate({
      ...form,
      monthly_income: Number(form.monthly_income),
      monthly_expenses: Number(form.monthly_expenses),
      total_savings: Number(form.total_savings),
      age: Number(form.age),
      investable_amount: investable + savingsAlloc,
    });
  };

  if (isLoading || !form) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold flex items-center gap-2">
          <User className="w-7 h-7 text-primary" /> Financial Profile
        </h1>
        <p className="text-muted-foreground mt-1">Update your profile to get better recommendations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-dm flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Income & Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Monthly Income (₹)</Label>
              <Input type="number" value={form.monthly_income} onChange={(e) => updateForm('monthly_income', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Monthly Expenses (₹)</Label>
              <Input type="number" value={form.monthly_expenses} onChange={(e) => updateForm('monthly_expenses', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Total Savings (₹)</Label>
              <Input type="number" value={form.total_savings} onChange={(e) => updateForm('total_savings', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={(e) => updateForm('age', e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-dm flex items-center gap-2">
            <Target className="w-4 h-4" /> Investment Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Investment Goal</Label>
              <Select value={form.investment_goal} onValueChange={(v) => updateForm('investment_goal', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Short Term (1-3 yrs)</SelectItem>
                  <SelectItem value="medium_term">Medium Term (3-7 yrs)</SelectItem>
                  <SelectItem value="long_term">Long Term (7+ yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk Appetite</Label>
              <Select value={form.risk_appetite} onValueChange={(v) => updateForm('risk_appetite', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience</Label>
              <Select value={form.investment_experience} onValueChange={(v) => updateForm('investment_experience', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="experienced">Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full md:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
